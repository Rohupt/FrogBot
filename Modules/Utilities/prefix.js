const Discord = require('discord.js');
const {random} = require('mathjs');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name];

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'everyone',
    
    description: 'Get the prefix of the bot',

    execute(client, message, args) {
        const embed = new Discord.MessageEmbed();
        embed.setAuthor(message.member.nickname ? message.member.nickname : message.author.username, message.author.avatarURL())
            .setColor(random([3], 256))
            .setTitle(`Prefix for this server: \`${client.prefix[message.guild.id]}\`.`)
            .setDescription(`You can ping the bot (like, \`@${client.user.tag} prefix\`) to get it again if you forget it.\n`
            + `By the way, didn't you see it in my nickname?`);

        message.channel.send(embed);
    },
};