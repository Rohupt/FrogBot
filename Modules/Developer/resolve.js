const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['res'];

module.exports = {
    name, aliases,
    module: mod,
    channelType: 0, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'everyone',
    userPermissionList: [],
    botPermissionList: [],
    minArguments: 1,
    
    description: 'Resolve a user, channel or role within the server.',
    usage: `\`<commandname>\``,

    async execute(client, message, args, joined, embed) {
        let result;
        if (!args[0].startsWith('-')) {
            result = client.util.user(message.guild, joined);
            if (!result) result = client.util.channel(message.guild, joined);
            if (!result) result = client.util.role(message.guild, joined);
        } else {
            switch (args[0]) {
                case '-u':
                    result = client.util.user(message.guild, args[1]);
                    break;
                case '-c':
                    result = client.util.channel(message.guild, args[1]);
                    break;
                case '-r':
                    result = client.util.role(message.guild, args[1]);
                    break;
                default:
                    return message.channel.send({embeds: [embed.setDescription('Wrong argument.')]});
            }
        }
        message.channel.send({embeds: [embed.setDescription(result ? result.toString() : 'Cannot resolve.')]});
    },
};