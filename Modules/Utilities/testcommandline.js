const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name, 'tcl'];


module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'developer',
    
    description: 'Help',

    execute(client, message, args) {
        var reply = '```\n';
        args.forEach(arg => reply += arg + '\n\n');
        reply += '```';
        message.channel.send(reply);
    },
};