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

        let channelList = [], roleList = [];

        let diplomaticCategory = await message.guild.channels.create('Diplomatics', {type: 'GUILD_CATEGORY'});
        channelList.push(diplomaticCategory.id);

        for (let i = 0; i < args.length; i++) {
            let arg = args[i];
            let factionName = arg.charAt(0).toUpperCase() + arg.slice(1).toLowerCase();
            let factionRole = await message.guild.roles.create({name: factionName, hoist: true, mentionable: true});
            roleList.push(factionRole.id);

            let factionCategory = await message.guild.channels.create(factionName, {
                type: 'GUILD_CATEGORY',
                permissionOverwrites: [
                    {id: factionRole.id, allow: 'VIEW_CHANNEL', type: 'role'},
                    {id: message.client.user.id, allow: ['MANAGE_CHANNELS', 'VIEW_CHANNEL'], type: 'member'},
                    {id: message.guild.roles.everyone.id, deny: 'VIEW_CHANNEL', type: 'role'},
                ],
            });
            channelList.push(factionCategory.id);
            await message.guild.channels.create(`${factionName}-file`, {
                type: 'GUILD_TEXT',
                parent: factionCategory,
                permissionOverwrites: [
                    {id: factionRole.id, deny: 'VIEW_CHANNEL', type: 'role'},
                    {id: message.client.user.id, allow: ['MANAGE_CHANNELS', 'VIEW_CHANNEL'], type: 'member'},
                    {id: message.guild.roles.everyone.id, deny: 'VIEW_CHANNEL', type: 'role'},
                ],
            });
            await message.guild.channels.create(`${factionName}-general`, {type: 'GUILD_TEXT', parent: factionCategory});
            await message.guild.channels.create(`${factionName}`, {type: 'GUILD_VOICE', parent: factionCategory});
            for (let j = i + 1; j < args.length; j++) {
                message.guild.channels.create(`${args[i]}-${args[j]}`, {type: 'GUILD_TEXT', parent: diplomaticCategory});
            }
        }

        await message.channel.send(`\`\`\`${channelList.join(' ')} ${roleList.join(' ')}\`\`\``);

        return message.reply('Done');
    },
};