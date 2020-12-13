const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name];

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'everyone',

    description: 'Get all aliases of all commands of the bot.',

    execute(client, message, args) {
        client.commands.delete(undefined);
        console.log(client.commands);
        var reply = `All the aliases of all commands of the bot:\n`;
        client.aliases.forEach((value, key) => {
            reply += `\`${key} = ${value}\`\n`;
        });
        message.channel.send(reply, {split: true});
    },
};