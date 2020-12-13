const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name, 'q'];


module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'everyone',
    
    description: 'Quote a message',

    async execute(client, message, args) {
        if (!args.length) return;
        
        var quoted = null;
        if (!args[0].includes('-')) {
            await message.channel.messages.fetch(args[0]).then(m => quoted = m).catch(e => {
                    if (e.code === Discord.Constants.APIErrors.UNKNOWN_MESSAGE)
                        quoted = null;
                });
                if (!quoted) {
                var textChannels = Array.from(message.guild.channels.cache.values()).filter(c => c.type == 'text');
                for (ch in textChannels) {
                    await textChannels[ch].messages.fetch(args[0]).then(m => quoted = m).catch(e => {
                        if (e.code === Discord.Constants.APIErrors.UNKNOWN_MESSAGE)
                            quoted = null;
                    });
                    if (quoted) break;
                };
            };
        } else {
            let subArgs = args[0].split('-');
            await message.guild.channels.resolve(subArgs[0]).messages.fetch(subArgs[1]).then(m => quoted = m);
        }
        if (!quoted) return message.reply("no such message found.");

        const embed = new Discord.MessageEmbed();
        embed.setAuthor(quoted.member.nickname ? quoted.member.nickname : quoted.author.username, quoted.author.avatarURL())
            .setColor(quoted.member.displayHexColor)
            .setDescription(quoted.content)
            .setTimestamp(quoted.createdAt)
            .setFooter('#' + quoted.channel.name)
            .addField("\u200b", `[[Jump to message]](${quoted.url})`);
        if (Array.from(quoted.attachments.values()).some(a => a.height)) {
            let image = Array.from(quoted.attachments.values()).find(a => a.height);
            embed.setImage(`${image.url}`);
        };
        
        message.channel.send(embed);
    },
};