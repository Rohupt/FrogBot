const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [];

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'everyone',
    userPermissionList: [],
    botPermissionList: [],
    minArguments: 1,
    
    description: 'Register DnDBeyond subscription.',
    usage: `\`<commandname> <option>\`: Register internal DnDBeyond subscription with the respective option.\n\n` +
        "The available options are:\n` 1`: 01 month (VND 60 000);\n` 3`: 03 months (VND 160 000);\n` 6`: 06 months (VND 290 000);\n`12`: 12 months (VND 520 000).",
    example: `<commandname> 3`,

    async execute(client, message, args, joined, embed) {
        let beyondChannel = client.util.channel(message.guild, require('@data/tlg.json').beyondChannel);
        let subsTime = args[0] == '1' ? '1 month'
            : args[0] == '3' ? '3 months'
            : args[0] == '6' ? '6 months'
            : args[0] == '12' ? '12 months'
            : null;
        if (!subsTime)
            return message.channel.send(embed.setDescription('Invalid option.\n\n' +
                'Available options are:\n` 1`: 01 month (VND 60 000);\n` 3`: 03 months (VND 160 000);\n` 6`: 06 months (VND 290 000);\n`12`: 12 months (VND 520 000).'));
        
        let price = args[0] == '1' ? 60000
            : args[0] == '3' ? 160000
            : args[0] == '6' ? 290000
            : args[0] == '12' ? 520000
            : null;
        if (message.member.roles.cache.find(r => r.id == '634967372976881664'))
            price = Math.round(price / 1000 * 0.9) * 1000;
        let messageToAdmins = `<@!${message.author.id}> registered for **${subsTime}** of DnDBeyond subscription.`;
        let messageToUser = `The subscription admins are informed.\n` +
            `Now please transfer **VND ${price}** to the account written in <#564383464502067201> ` +
            `and send the receipt screenshot to one of the members with <@&676089704571207690> role to complete registering.\n\n` +
            `${message.member.roles.cache.find(r => r.id == '634967372976881664') ? 'You have 10% discount due to having the <@&634967372976881664> role.\n' : ''}` +
            `Any ${message.member.roles.cache.find(r => r.id == '634967372976881664') ? 'other ' : ''}discounts will be informed to you by the subscription admins.`;
        await beyondChannel.send(embed.setDescription(messageToAdmins));
        return message.channel.send(embed.setDescription(messageToUser));
    },
};