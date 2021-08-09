const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['mcdm'];

const CampModel = require('@data/Schema/camp-schema.js');

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'moderators',
    userPermissionList: [],
    botPermissionList: ['MANAGE_CHANNELS', 'MANAGE_ROLES'],
    minArguments: 2,
    
    description: 'Modify the Dungeon Master of a campaign.',
    usage: `\`<commandname> <campaign> <newDM>\`\n` +
        "Names should be wrapped in double quotes if contains a space.\n",

    async execute(client, message, args, joined, embed) {
        var tlg = client.util.reloadFile('@data/tlg.json');
        const guild = client.guilds.resolve(tlg.id);
        var campList = await CampModel.find({});
        
        const camp = campList.find(c => c.name.toLowerCase().includes(args[0].toLowerCase()));
        if (!camp) {
            embed.setDescription(`There is no campaign named \`${args[0]}\`.`);
            return message.channel.send({embeds: [embed]});
        };

        const newDM = client.util.user(message.guild, args[1]);
        if (!newDM) {
            embed.setDescription("Please provide the new DM's identity.");
            return message.channel.send({embeds: [embed]});
        };
        const oldDM = client.util.user(message.guild, camp.DM);
        if (newDM === oldDM) {
            embed.setDescription("The old DM and the new one are the same person, hence no change made.");
            return message.channel.send({embeds: [embed]});
        };

        const rpCh = guild.channels.resolve(camp.roleplayChannel), dcCh = guild.channels.resolve(camp.discussChannel);
        camp.DM = newDM.id;
        rpCh.permissionOverwrites.delete(oldDM?.id ?? camp.DM);
        dcCh.permissionOverwrites.delete(oldDM?.id ?? camp.DM);
        if (!camp.players.some(p => p == (oldDM?.id ?? camp.DM)))
            oldDM.roles.remove(camp.role);
        if (!campList.filter(c => c.DM == (oldDM?.id ?? camp.DM)).length && oldDM.roles.cache.has(tlg.dmRoleID))
            oldDM.roles.remove(tlg.dmRoleID);
        
        if (!newDM.roles.cache.has(camp.role))
            newDM.roles.add([camp.role]);
        if (!newDM.roles.cache.has(tlg.dmRoleID))
            await newDM.roles.add([tlg.dmRoleID]);
        rpCh.permissionOverwrites.create(newDM, {'SEND_MESSAGES': true, 'MANAGE_MESSAGES': true});
        dcCh.permissionOverwrites.create(newDM, {'SEND_MESSAGES': true, 'MANAGE_MESSAGES': true});
        
        await CampModel.updateOne({ _id: camp.id }, { $set: {DM: camp.DM}});
        embed.setTitle(camp.name).setDescription("Dungeon Master changed sucessfully:")
            .addField('Old DM', oldDM.toString(), true).addField('New DM', newDM.toString(), true);
        message.channel.send({embeds: [embed]});
    },
};