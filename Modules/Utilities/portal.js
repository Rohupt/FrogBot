const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['p'];

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'everyone',
    userPermissionList: [],
    botPermissionList: [],
    minArguments: 1,
    
    description: '',
    usage: `\`<commandname> <channel>\` Create a portal to another channel.`,

    async execute(client, message, args, joined, embed) {
        let channel = client.util.channel(message.guild, args[0]);
        if (!channel || channel.type != 'GUILD_TEXT') {
            embed.setDescription('Invalid channel. Please enter a valid one.');
            return message.reply({embeds: [embed]});
        }

        let portals = [];
        await channel.send({embeds: [embed]}).then(m => portals[0] = m);
        embed.setTitle('Portals created')
            .setDescription(`[Click here to go to #${channel.name}](${portals[0].url})`);
        await message.channel.send({embeds: [embed]}).then(m => portals[1] = m);
            embed.setDescription(`[Click here to go to #${message.channel.name}](${portals[1].url})`);
        portals[0].edit({embeds: [embed]});
    },
};