const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['c', 'evaluate', 'eval'];

const {evaluate} = require('mathjs');

module.exports = {
    name, aliases,
    module: mod,
    channelType: 0, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'everyone',
    userPermissionList: [],
    botPermissionList: [],
    minArguments: 1,
    
    description: 'Evaluate an expression, using [mathjs](https://mathjs.org/docs/expressions/syntax.html) syntax.',
    usage: `\`<commandname> 2 * 3 + 4\`\n` +
            `\`<commandname> 2 inch to cm\`\n` +
            `\`<commandname> cos(45 deg)\`\n`,

    async execute(client, message, args, joined, embed) {
        let result;
        try { result = evaluate(joined); }
        catch (err) { result = 'Cannot evaluate the provided expression. Please check the syntax.'; }
        embed.setDescription(`\`${joined}\``)
            .addField('Result', `\`${result}\``);

        message.channel.send({embeds: [embed]});
    },
};