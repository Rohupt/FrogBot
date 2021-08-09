const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['cl'];

const Discord = require('discord.js');

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'developer',
    userPermissionList: [],
    botPermissionList: ['MANAGE_CHANNELS', 'MANAGE_ROLES'],
    minArguments: 0,
        
    description: 'List all channels of the server.',
    usage: '`<commandname>`',

    execute(client, message, args) {
        const channels = message.guild.channels.cache;
        const channelList = Array.from(channels.values()).filter(channel => channel.position != undefined && channel != null).sort((a, b) => {
            if (args.includes('-s'))
                switch (args[args.indexOf('-s') + 1]) {
                    case 'pos':
                        return a.position != b.position
                            ? a.position - b.position
                            : a.rawPosition - b.rawPosition;
                    case 'raw':
                        return a.rawPosition != b.rawPosition
                            ? a.rawPosition - b.rawPosition
                            : b.position - a.position;
                    case 'cat':
                        function category(channel) {
                            let c = channel;
                            while (c != null && c.type != 'GUILD_CATEGORY') c = c.parent;
                            return c;
                        }
                        return category(a).position != category(b).position
                            ? category(a).position - category(b).position
                            : a.position - b.position;
                }
            else return a < b ? -1 : a == b ? 0 : 1;
        });
        console.log(channelList.length);
        var reply = ``, count = 0;
        const pad = Math.floor(Math.log10(channels.size)) + 1;

        channelList.forEach(channel => {
            if (!args.includes('-t') || args[args.indexOf('-t') + 1] == channel.type)
                reply += `\`#${(++count).toString().padStart(pad)} (${channel.position.toString().padStart(pad)}/${channel.rawPosition.toString().padStart(pad)}):\` ${channel}\n`;
        });
        Discord.Util.splitMessage(reply).forEach(m => message.channel.send(m));
    },
};