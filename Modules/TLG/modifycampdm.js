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
            return message.channel.send(embed);
        };

        const newDM = guild.members.resolve(user(message.guild, args[1]));
        if (!newDM) {
            embed.setDescription("Please provide a new DM's identity.");
            return message.channel.send(embed);
        };
        const oldDM = guild.members.resolve(camp.DM);
        if (newDM === oldDM) {
            embed.setDescription("The old DM and the new one are the same person, hence no change made.");
            return message.channel.send(embed);
        };

        const rpCh = guild.channels.resolve(camp.roleplayChannel), dcCh = guild.channels.resolve(camp.discussChannel);
        camp.DM = newDM.id;
        if (rpCh.permissionOverwrites.get(oldDM.id)) rpCh.permissionOverwrites.get(oldDM.id).delete();
        if (dcCh.permissionOverwrites.get(oldDM.id)) dcCh.permissionOverwrites.get(oldDM.id).delete();
        if (!camp.players.some(p => p == oldDM.id))
            oldDM.roles.remove(camp.role);
        if (!campList.filter(c => c.DM == oldDM.id).length)
            oldDM.roles.remove(tlg.dmRoleID);
        
        newDM.roles.add([camp.role, tlg.dmRoleID]);
        rpCh.updateOverwrite(newDM, {'SEND_MESSAGES': true, 'MANAGE_MESSAGES': true});
        dcCh.updateOverwrite(newDM, {'SEND_MESSAGES': true, 'MANAGE_MESSAGES': true});
        
        await CampModel.updateOne({ _id: camp.id }, { $set: {DM: camp.DM}});
        embed.setTitle(camp.name).setDescription("Dungeon Master changed sucessfully:")
            .addField('Old DM', oldDM, true).addField('New DM', newDM, true);
        message.channel.send(embed);
    },
};