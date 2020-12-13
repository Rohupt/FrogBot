const {sep} = require('path');
const {evaluate} = require('mathjs');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name, 'c', 'evaluate', 'eval'];

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'everyone',
    
    description: 'Calculate the given expression',

    execute(client, message, args) {
        if (args.length < 1) {
            message.channel.send(`Not enough values to calculate. Try \`${client.prefix[message.guild.id]}calc 2+4*10\` or \`${client.prefix[message.guild.id]}calc 10 m to yd\`.`);
            return
        }
        const expr = args.join(' ');
        const response = `\`\`\`\n${expr}\`\`\`\`\`\`\n= ${evaluate(expr)}\`\`\``
        message.channel.send(response);
    },
};