const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name, 'h'];


module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'everyone',
    
    description: 'Help',

    execute(client, message, args) {
        if (args.length > 0) {
            message.channel.send(`It looks like you might need help with ` + args);
        } else {
            message.channel.send(`I'm not sure what you need help with. Try \`${client.prefix[message.guild.id]}help [topic]\``);
        }
    },
};