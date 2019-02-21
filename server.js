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

let configData = config;


let fileWrite = function(data){
    let info = JSON.stringify(data, null, 2);
    fs.writeFile('config.json', info, (err) => {  
        if (err) throw err;
    });
}

//Running Server
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname))

http.listen(80, function(){
  console.log('listening on *');
});

//On connection to the interface
io.on('connection', function(socket){
    socket.on('disconnect',function(){
        bot.destroy();
        console.log('Goodbye!');
    });

    socket.emit('config', config);

    socket.on('inputtoken', function(tokenID){
        configData.token = tokenID;
        fileWrite(configData);
    });

    socket.on('inputchannel', function(channelID){
        configData.channelID = channelID;
        fileWrite(configData);
    });

    socket.on('inputguild', function(guildID){
        configData.guildID = guildID;
        fileWrite(configData);
    });
        imageList = [];
        bot.on('ready',function(){
            console.log("Loading up bot");
            socket.emit('images', bot.guilds.map(g => ({ id: g.id, icon: g.iconURL })));
            socket.emit('userload', ({icon: bot.user.avatarURL, name: bot.user.username, discrim: bot.user.discriminator}));
            
            if(config.channelID){
                channel = bot.channels.get(config.channelID);
            }

            if(config.guildID){
                guild = bot.guilds.get(config.guildID);
            }

            if(guild){
                socket.emit('channels', guild.channels.map(
                    c => ({
                        visible: c.permissionsFor(bot.user).has("READ_MESSAGES"),
                        sendable: c.permissionsFor(bot.user).has("SEND_MESSAGES"),
                        type: c.type,
                        name: "#" + c.name,
                        id: c.id 
                    })));

            
                socket.emit('members', guild.members.map(m => ({name: m.user.username, icon: m.user.avatarURL, color: m.displayHexColor, guild: m.guild})));
                socket.emit('guildname', guild.name);

            }

            if(channel){
                socket.on('message', function(msg){
                    channel.send(
                        msg
                    );
                });
            }
            
            socket.on('changeguild', function(id){
                if(id != null){
                        configData.guildID = id.toString();
                        fileWrite(configData);
                    }
                    let config = require("./config.json");
    
                    guild = bot.guilds.get(config.guildID);
                    socket.emit('channels', guild.channels.map(
                    c => ({
                        visible: c.permissionsFor(bot.user).has("READ_MESSAGES"),
                        sendable: c.permissionsFor(bot.user).has("SEND_MESSAGES"),
                        type: c.type,
                        name: "#" + c.name,
                        id: c.id 
                    })));
                    socket.emit('members', guild.members.map(m => ({user: m,name: m.user.username, icon: m.user.avatarURL, color: m.displayHexColor, guild: m.guild, guildroles: m.guild.roles})));
                    socket.emit('guildname', guild.name);
            });
            
            socket.on('changechannel', function(id){
                    if(id != null){
                        configData.channelID = id.toString();
                        fileWrite(configData);
                    }
                    let config = require("./config.json");
                    channel = bot.channels.get(config.channelID);
                    socket.emit('channeldisplay', channel.name)
            });

            if(channel){
                socket.emit('channeldisplay', channel.name);

                setInterval(function obtainmessage(){
                        channel.fetchMessages({ limit: 20 })
                        .then(messages => socket.emit('channelmessage', messages.map(m => ({src: m.author.avatarURL, author: m.author.username, discrim: m.author.discriminator, content: m.content, color: m.displayHexColor, roles: m.guild.roles.map(r => r)}))))
                        .catch(console.error);
                },1000);
            }

    });
    if(config.token){
        console.log('Loading up token');
        bot.login(config.token);
        console.log("Loaded token {" + config.token + "}");
    } else {
        console.log("You need to input a token in config.json");
    }
});
