/* 



    <-----> Discord Bot GUI <----->
    Created by the Discord Bot GUI Team.

    Please do not modify this client as
    you will experience issues.

    This not an official discord client. 
    We do not take credit for the api used 
    with this GUI.

    For support, suggestions, and talk about 
    the discord bot client, please go to:
        [https://discord.gg/PEJ5ZVc]

    

*/

//Libs
const express = require("express");
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Discord = require('discord.js')
let bot = new Discord.Client();
const fs = require("fs");

//Loads config
let config = require("./config.json");

let channel,
    guild;

//Loads writable config
let configData = config;

//Function filewrite that writes out data to the config
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

//On browser connection
io.on('connection', function(socket){
    //Loads the bot
    bot = new Discord.Client();
    //Logs out of bot, allows us to reload
    socket.on('disconnect',function(){
        bot.destroy();
        console.log('Goodbye!');
    });

    //Sends config to html file for loading
    socket.emit('config', config);

    //Broken but supposed to write the token to the config
    socket.on('inputtoken', function(tokenID){
        configData.token = tokenID;
        fileWrite(configData);
        config = require("./config.json");
        configData = config;
    });

    //Writes the new channel's info
    socket.on('inputchannel', function(channelID){
        configData.channelID = channelID;
        fileWrite(configData);
        config = require("./config.json");
        configData = config;
    });

    //Writes the new guild's info
    socket.on('inputguild', function(guildID){
        configData.guildID = guildID;
        fileWrite(configData);
        config = require("./config.json");
        configData = config;
    });

    //When bot loads
    bot.on('ready',function(){
        console.log("Bot Loaded");
        //Loads the guild icons
        socket.emit('images', bot.guilds.map(g => ({ id: g.id, icon: g.iconURL })));
        //Loads user name, discrim, and avatar
        socket.emit('userload', ({icon: bot.user.avatarURL, name: bot.user.username, discrim: bot.user.discriminator}));
            
        //Loads the channel from config
        if(config.channelID){
            channel = bot.channels.get(config.channelID);
        }

        //Loads the guild from config
        if(config.guildID){
            guild = bot.guilds.get(config.guildID);
        }

        if(guild){
            //Emits the channels
            socket.emit('channels', guild.channels.map(
                c => ({
                    visible: c.permissionsFor(bot.user).has("READ_MESSAGES"),
                    sendable: c.permissionsFor(bot.user).has("SEND_MESSAGES"),
                    type: c.type,
                    name: "#" + c.name,
                    id: c.id,
                    position: c.position
                })));

            //Emits the members
            socket.emit('members', guild.members.map(m => ({name: m.user.username, icon: m.user.avatarURL, color: m.displayHexColor, guild: m.guild})));
            //Sends the guild name to above the channels
            socket.emit('guildname', guild.name);

        }

        //Receiving the messages from the input
        if(channel){
            socket.on('message', function(msg){
                //sends the message to the channel that is selected in config
                channel.send(
                    msg
                );
                
                //Supposed to fetch messages
                setTimeout(function(){
                    channel.fetchMessages()
                        .then(messages => socket.emit('channelmessage', messages.map(m => ({src: m.author.avatarURL, author: m.author.username, discrim: m.author.discriminator, content: m.content, color: m.displayHexColor, roles: m.guild.roles.map(r => r), channel: m.channel}))))
                        .catch(console.error);
                }, 5000);

                
            });
        }
                
        //When someone clicks a guild icon
        socket.on('changeguild', function(id){
                //Writes the config guild
                if(id != null){
                    configData.guildID = id.toString();
                    fileWrite(configData);
                }
                //Reloads the config
                config = require("./config.json");
        
                //Grabs the guild from config
                guild = bot.guilds.get(config.guildID);

                //Emits the channels of the guild
                socket.emit('channels', guild.channels.map(
                c => ({
                    visible: c.permissionsFor(bot.user).has("READ_MESSAGES"),
                    sendable: c.permissionsFor(bot.user).has("SEND_MESSAGES"),
                    type: c.type,
                    name: "#" + c.name,
                    id: c.id 
                })));

                //Sends the members of the guild
                socket.emit('members', guild.members.map(m => ({user: m,name: m.user.username, icon: m.user.avatarURL, color: m.displayHexColor, guild: m.guild, guildroles: m.guild.roles})));
                //Sends the guild name to above the channels
                socket.emit('guildname', guild.name);
        });
                
        //When someone clicks a channel
        socket.on('changechannel', function(id){
                    if(id != null){
                    configData.channelID = id.toString();
                    fileWrite(configData);
                }

            config = require("./config.json");
            channel = bot.channels.get(config.channelID);

            channel.fetchMessages()
            .then(messages => socket.emit('channelmessage', messages.map(m => ({src: m.author.avatarURL, author: m.author.username, discrim: m.author.discriminator, content: m.content, color: m.displayHexColor, roles: m.guild.roles.map(r => r), channel: m.channel}))))
            .catch(console.error);
            
        });

        //Emits the messages
        if(channel){
            channel.fetchMessages()
            .then(messages => socket.emit('channelmessage', messages.map(m => ({src: m.author.avatarURL, author: m.author.username, discrim: m.author.discriminator, content: m.content, color: m.displayHexColor, roles: m.guild.roles.map(r => r), channel: m.channel}))))
            .catch(console.error);
            
        }

    });

    //On message allows us to see when someone sends a message
    bot.on('message',function(message){
        if(channel){

        }
                channel.fetchMessages()
                .then(messages => socket.emit('channelmessage', messages.map(m => ({src: m.author.avatarURL, author: m.author.username, discrim: m.author.discriminator, content: m.content.replace('\n','<br>'), color: m.displayHexColor, roles: m.guild.roles.map(r => r), channel: m.channel}))))
                .catch(console.error);
    });

    //Bot login config
    if(config.token){
        console.log('Loading up token');
        bot.login(config.token);
        console.log("Loaded token {" + config.token + "}");
    } else {
        console.log("You need to input a token in config.json");
    }
});
