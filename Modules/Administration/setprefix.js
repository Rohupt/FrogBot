const Discord = require('discord.js');
const {sep} = require('path');
const {random} = require('mathjs');
const ejf = require('edit-json-file');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name, 'sp'];

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'administrators',
    
    description: 'Set the prefix of the bot',

    execute(client, message, args) {
        const embed = new Discord.MessageEmbed();
        embed.setAuthor(message.member.nickname ? message.member.nickname : message.author.username, message.author.avatarURL())
            .setColor(random([3], 256));
        
        if (!args.length) {
            message.reply("what is your new prefix?");
            return;
        }
        const newprefix = args[0];
        let config = ejf('./Data/config.json', {
            stringify_width: 4,
            autosave: true
        });
        config.set(`prefix\.${message.guild.id}`, newprefix);
        client.prefix[message.guild.id] = newprefix;
        embed.setDescription(`Prefix changed to \`${newprefix}\` for this server`)
        message.channel.send(embed);
        message.guild.me.setNickname(`ValderBot (${newprefix})`);
    },
};