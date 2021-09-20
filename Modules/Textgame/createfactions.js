const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['cf'];

module.exports = {
    name, aliases,
    module: mod,
    channelType: 0, //-1: direct message only, 0: both, 1: guild channel only
    permission: '',
    userPermissionList: ['moderators'],
    botPermissionList: ['MANAGE_CHANNELS', 'MANAGE_ROLES', 'SEND_MESSAGES'],
    minArguments: 1,
    
    description: '',
    usage: `\`<commandname> <factions-list>\`: Create factions' roles, channels and diplomatic channels.`,

    async execute(client, message, args, joined, embed) {
        if (args.length < 2) {
            return message.reply('You must create less than 2 factions.');
        }

        if (args.length > 9) {
            return message.reply('You cannot create more than 9 factions.');
        }

        let gmRoleId = client.util.role(message.guild, 'Game Master').id;

        let channelList = [], roleList = [];

        let diplomaticCategory = await message.guild.channels.create('Diplomatics', {
            type: 'GUILD_CATEGORY',
            permissionOverwrites: [
                {id: message.guild.roles.everyone.id, deny: 'VIEW_CHANNEL', type: 'role'},
                {id: gmRoleId, allow: 'VIEW_CHANNEL', type: 'role'},
            ],
        });
        channelList.push(diplomaticCategory.id);

        for (let i = 0; i < args.length; i++) {
            let arg = args[i];
            let factionName = arg.charAt(0).toUpperCase() + arg.slice(1);
            let factionLeaderRole = await message.guild.roles.create({name: factionName + ' Leader', hoist: false, mentionable: true});
            let factionRole = await message.guild.roles.create({name: factionName, hoist: true, mentionable: true});
            roleList.push(factionLeaderRole.id, factionRole.id);

            let factionCategory = await message.guild.channels.create(factionName, {
                type: 'GUILD_CATEGORY',
                permissionOverwrites: [
                    {id: factionRole.id, allow: 'VIEW_CHANNEL', type: 'role'},
                    {id: gmRoleId, allow: 'VIEW_CHANNEL', type: 'role'},
                    {id: message.guild.roles.everyone.id, deny: 'VIEW_CHANNEL', type: 'role'},
                ],
            });
            channelList.push(factionCategory.id);
            await message.guild.channels.create(`${factionName}-file`, {
                type: 'GUILD_TEXT',
                parent: factionCategory,
                permissionOverwrites: [
                    {id: factionRole.id, deny: 'VIEW_CHANNEL', type: 'role'},
                    {id: factionLeaderRole.id, allow: 'VIEW_CHANNEL', type: 'role'},
                    {id: gmRoleId, allow: 'VIEW_CHANNEL', type: 'role'},
                    {id: message.guild.roles.everyone.id, deny: 'VIEW_CHANNEL', type: 'role'},
                ],
            });
            await message.guild.channels.create(`${factionName}-general`, {parent: factionCategory});
            await message.guild.channels.create(`${factionName}`, {type: 'GUILD_VOICE', parent: factionCategory});
            for (let j = 0; j < i; j++) {
                let x = (i + j) % 2 == 0;
                message.guild.channels.create(`${args[x ? i : j]}-${args[x ? j : i]}`, {
                    parent: diplomaticCategory,
                    permissionOverwrites: [
                        {id: message.guild.roles.everyone.id, deny: 'VIEW_CHANNEL', type: 'role'},
                        {id: gmRoleId, allow: 'VIEW_CHANNEL', type: 'role'},
                        {id: factionLeaderRole.id, allow: 'VIEW_CHANNEL', type: 'role'},
                        {id: roleList[j * 2], allow: 'VIEW_CHANNEL', type: 'role'},
                    ],
                });
            }
        }

        await message.channel.send(`\`\`\`${channelList.join(' ')} ${roleList.join(' ')}\`\`\``);

        return message.reply('Done');
    },
};