const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name];

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'everyone',
    
    description: 'Ping the bot to see if it answers or not.',

    execute(client, message, args) {
        var embed = new Discord.MessageEmbed();
        embed.setColor(message.author.displayHexColor)
            .setDescription(`Pong! 🏓`);
        message.channel.send(embed).then((resultMessage) => {
            embed.setDescription(`Pong! 🏓 Bot latency \`${resultMessage.createdTimestamp - message.createdTimestamp}\`ms, API latency: \`${client.ws.ping}\` ms.`);
            resultMessage.edit(embed);
        });
    },
};