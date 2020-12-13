const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name, 'chp'];

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'moderators',
    
    description: 'Move a channel',

    execute(client, message, args) {
        var channel = client.util.channelFM(message, args[0]);
        var newPos = parseInt(args[1]);

        const oldPos = channel.position;
        channel.setPosition(newPos)
            .then(ch => message.channel.send(`Channel ${ch} changed from position ${oldPos} to position ${ch.position}`));
    },
};