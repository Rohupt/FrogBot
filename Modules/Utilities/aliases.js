const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name];

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'everyone',
    
    description: 'Get the aliases of a command.',

    execute(client, message, args) {
        if (args.length < 1) {
            message.reply("what command do you want to investigate?");
            return;
        }
        
        const command = args[0];
        var reply = `The aliases of the command \`${command}\` are:\n`;
        client.aliases.filter((value, key) => value == client.aliases.get(command)).forEach((value, key) => {
            reply += `\`${key}\` `;
        });
        message.channel.send(reply);
    },
};