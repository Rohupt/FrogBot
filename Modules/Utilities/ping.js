const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name];

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'everyone',
    
    description: 'Ping the bot to see if it answers or not.',

    execute(client, message, args) {
        message.channel.send(`Pong! 🏓`).then((resultMessage) => {
            resultMessage.edit(`Pong! 🏓\nBot latency \`${resultMessage.createdTimestamp - message.createdTimestamp}\`ms, API latency: \`${client.ws.ping}\` ms.`);
        });
    },
};