const Commando = require("discord.js-commando");
const bot = new Commando.Client();

//on ready
bot.on('ready',function(){
    console.log("Ready");
});

//on message
/*
bot.on('message',function(message){
    if(message.content == "Hello"){
        message.channel.sendMessage("Hello There");
    }
});
*/



bot.login("NTEwODY1NTc0MzUyNTE5MTY5.D0AYiA.jId1RNhM51ryJGooa7uOtVhc96s");