const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['chp'];

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'developer',
    userPermissionList: [],
    botPermissionList: ['MANAGE_CHANNELS', 'MANAGE_ROLES'],
    minArguments: 2,
    
    description: 'Move a channel',
    usage: '`<commandname> <channel> <position>`',

    execute(client, message, args) {
        var channel = client.util.channel(message.guild, args[0]);
        var newPos = parseInt(args[1]);

        const oldPos = channel.position;
        channel.setPosition(newPos)
            .then(ch => message.channel.send(`Channel ${ch} changed from position ${oldPos} to position ${ch.position}`));
    },
};