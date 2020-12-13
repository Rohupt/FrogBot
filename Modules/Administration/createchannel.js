const {sep} = require('path');
const ejf = require('edit-json-file');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name, 'cch'];

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'moderators',
    
    description: 'Create a new channel',

    execute(client, message, args) {
        if (args.length < 1) {
            message.reply("please provide at least the channel name.");
            return;
        }

        var channel;

        if (args.length == 1) {
            message.guild.channels.create(args[0], {
                type: 'text',
                position: 0,
            }).then(ch => {
                channel = ch;
                message.channel.send(`Channel created: <#${channel.id}>, position: \`${channel.position}\` / \`${channel.rawPosition}\`.`);
            });
            return;
        }
    },
};