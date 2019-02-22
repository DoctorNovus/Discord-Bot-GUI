const express = require("express");
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Discord = require('discord.js')
const bot = new Discord.Client();
const fs = require("fs");

let config = require("./config.json");

let channel,
    guild;

let fileWrite = function (data){
  let info = JSON.stringify(data, null, 2);
  fs.writeFileSync('config.json', info);
}

//Running Server
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname))


http.listen(3000, () => {
  console.log('listening on *');
});

//On connection to the interface
io.on('connection', (socket) => {
  socket.emit('images', bot.guilds.map(g => ({ id: g.id, icon: g.iconURL })));
  socket.emit('userload', {
    icon: bot.user.avatarURL,
    name: bot.user.username,
    discrim: bot.user.discriminator
  });
            
  if (config.channelID){
    channel = bot.channels.get(config.channelID);
  }

  if (config.guildID){
    guild = bot.guilds.get(config.guildID);
  }

  if (guild){
    socket.emit('channels', guild.channels.map(
      c => ({
        visible: c.permissionsFor(bot.user).has("READ_MESSAGES"),
        sendable: c.permissionsFor(bot.user).has("SEND_MESSAGES"),
        type: c.type,
        name: "#" + c.name,
        id: c.id
      })));

            
    socket.emit(
      'members',
      guild.members.map(m => ({
        name: m.user.username,
        icon: m.user.avatarURL,
        color: m.displayHexColor,
        guild: m.guild
      }))
    );
    socket.emit('guildname', guild.name);

  }
  if (channel){
    socket.on('message', (msg) => {
      channel.send(
        msg
      );
    });
            
    socket.emit('channeldisplay', channel.name);

    setInterval(() => {
      channel.fetchMessages({ limit: 20 })
        .then(messages => socket.emit(
          'channelmessage',
          messages.map(m => ({
            src: m.author.avatarURL,
            author: m.author.username,
            discrim: m.author.discriminator,
            content: m.content,
            color: m.displayHexColor,
            roles: m.guild.roles.map(r => r)
          }))
        ))
        .catch(console.error);
    }, 1000);
  }
  
  socket.on('disconnect', () => {
    //bot.destroy();
    console.log('Goodbye!');
  });

  socket.emit('config', config);

  socket.on('inputtoken', (tokenID) => {
    config.token = tokenID;
    fileWrite(config);
  });

  socket.on('inputchannel', (channelID) => {
    config.channelID = channelID;
    fileWrite(config);
  });

  socket.on('inputguild', (guildID) => {
    config.guildID = guildID;
    fileWrite(config);
  });
  socket.on('changeguild', (id) => {
    if (id !== null){
      config.guildID = id.toString();
      fileWrite(config);
    }
    
    guild = bot.guilds.get(config.guildID);
    socket.emit('channels', guild.channels.map(
      c => ({
        visible: c.permissionsFor(bot.user).has("READ_MESSAGES"),
        sendable: c.permissionsFor(bot.user).has("SEND_MESSAGES"),
        type: c.type,
        name: "#" + c.name,
        id: c.id
      })));
    socket.emit(
      'members',
      guild.members.map(m => ({
        user: m,
        name: m.user.username,
        icon: m.user.avatarURL,
        color: m.displayHexColor,
        guild: m.guild,
        guildroles: m.guild.roles
      }))
    );
    socket.emit('guildname', guild.name);
  });
  socket.on('changechannel', (id) => {
    if (id !== null){
      config.channelID = id.toString();
      fileWrite(config);
    }
    channel = bot.channels.get(config.channelID);
    socket.emit('channeldisplay', channel.name)
  });
  let imageList = [];
});
bot.on('ready', () => {
  console.log("Loading up bot");

});
if (config.token){
  console.log('Loading up token');
  bot.login(config.token);
  console.log("Loaded token {" + config.token + "}");
} else {
  console.log("You need to input a token in config.json");
}

