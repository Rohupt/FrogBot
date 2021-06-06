const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['delcamp', 'dc'];

const CampModel = require('@data/Schema/camp-schema.js');

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'moderators',
    userPermissionList: [],
    botPermissionList: ['MANAGE_CHANNELS', 'MANAGE_ROLES'],
    minArguments: 0,
    
    description: 'Delete a camp from database, as well as its role and channels',
    usage: `\`<commandname> <name>\` Delete a campaign named <name>\n` +
        'The name should be wrapped in double quotes if it contains a space.',

    async execute(client, message, args, joined, embed) {
        var tlg = client.util.reloadFile('@data/tlg.json');
        var campList = await CampModel.find({});
        const guild = client.guilds.resolve(tlg.id);
        
        const campName = joined;
        const camp = campList.find(c => c.name.toLowerCase().includes(campName.toLowerCase()));
        if (!camp) {
            embed.setDescription('There is no campaign with such name.');
            return message.channel.send(embed);
        };

        var cont = false;
        embed.setDescription(`Do you really want to delete the campaign \`${camp.name}\`?\nAnything other than \`Absolutely yes\`will be interpreted as \`no\`.`)
        await message.reply(embed)
            .then(async () => {
                await message.channel.awaitMessages(m => m.author == message.author, {idle : 60000, dispose : true, max : 1, error : ['time']})
                    .then(collected => {
                        if (collected.first().content.toLowerCase().startsWith(`absolutely yes`))
                            cont = true;
                    });
            });
        if (!cont)
            return message.reply(embed.setDescription("Campaign deletion cancelled."));
        
        try {
            await guild.roles.resolve(camp.role).delete();
            await guild.channels.resolve(camp.discussChannel).delete();
            await guild.channels.resolve(camp.roleplayChannel).delete();
        } catch (error) {}
        const dm = guild.members.resolve(camp.DM);
        
        campList.splice(campList.indexOf(camp), 1);
        const campRoleMaxPos = guild.roles.resolve(tlg.noCampRoleID).position,
            campRoleMinPos = guild.roles.resolve(tlg.advLeagueRoleCatID).position;
        if (dm) {
            if (!campList.filter(c => c.DM == camp.DM).length)
                dm.roles.remove(tlg.dmRoleID);
            if (!dm.roles.cache.some(r => (r.position > campRoleMinPos && r.position < campRoleMaxPos)))
                dm.roles.add(tlg.noCampRoleID);
        }
        for (p of camp.players) {
            let player = await guild.members.resolve(p);
            if (!player.roles.cache.some(r => (r.position > campRoleMinPos && r.position < campRoleMaxPos)))
                await player.roles.add(tlg.noCampRoleID);
        };
        await CampModel.deleteOne({ _id: camp.id });
        message.reply(embed.setDescription("Campaign deleted."));
    },
};