const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['arccamp', 'ac'];

const CampModel = require('@data/Schema/camp-schema.js');

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'moderators',
    userPermissionList: [],
    botPermissionList: [],
    minArguments: 0,
    
    description: 'Archive a campaign.',
    usage: `\`<commandname> <campaign>\`\n` +
        "The campaign name should be wrapped in double quotes if contains a space.",

    async execute(client, message, args, joined, embed) {
        const pos = {
            archive : function() {
                let tlg = client.util.reloadFile('@data/tlg.json');
                return Array.from(client.guilds.cache.get(tlg.id).channels.cache.values())
                    .filter(ch => (ch.parentId == tlg.archiveCat))
                    .sort((a, b) => {return b.position - a.position})[0]
                    ?.position || 0;
            },
        };

        var {id, archiveCat, noCampRoleID, advLeagueRoleCatID, dmRoleID} = client.util.reloadFile('@data/tlg.json');
        var campList = await CampModel.find({});
        var guild = client.guilds.resolve(id);
        
        let camp = (await client.util.findCamp(message, args)).camp;
        if (!camp)
            return message.channel.send({embeds: [embed.setDescription("Please enter the camp name.")]});
        
        var cont = false;
        embed.setDescription(`do you really want to archive the campaign \`${camp.name}\`?\nAnything other than \`Absolutely yes\`will be interpreted as \`no\`.`)
        await message.reply({embeds: [embed]})
            .then(async () => {
                await message.channel.awaitMessages({filter: m => m.author == message.author, idle : 60000, dispose : true, max : 1, error : ['time']})
                    .then(collected => {
                        if (collected.first().content.toLowerCase().startsWith(`absolutely yes`))
                            cont = true;
                    });
            });
        if (!cont)
            return message.channel.send({embeds: [embed.setDescription("Campaign archiving cancelled.")]});

        if (client.util.channel(message.guild, archiveCat).children.size >= client.constants.MAX_CHANNELS_PER_CATEGORY) {
            let prefix = await client.util.commandPrefix(client, message);
            return message.channel.send({embeds: [embed.setDescription(`Archive category full. Please change to another category (using \`${prefix}acat\`) before continuing.`)]});
        }
        
        const newPos = pos.archive() + 1;
        campList.splice(campList.indexOf(camp), 1);
        try {
            await guild.channels.resolve(camp.roleplayChannel).setParent(archiveCat);
            await guild.channels.resolve(camp.discussChannel).delete();
            await guild.roles.resolve(camp.role).delete();
        } catch (error) {
            console.error(error);
            embed.setDescription("...oops, seems like there is an error. Deletion incomplete. Please continue manually.")
            message.reply({embeds: [embed]});
            return message.channel.send(`\`\`\`\n${error}\n\`\`\``);
        }

        guild.channels.resolve(camp.roleplayChannel).setPosition(newPos);
        await CampModel.deleteOne({ _id: camp.id });
        const campRoleMaxPos = guild.roles.resolve(noCampRoleID).position,
            campRoleMinPos = guild.roles.resolve(advLeagueRoleCatID).position;
        if (!campList.filter(c => c.DM == camp.DM).length) {
            guild.members.resolve(camp.DM).roles.remove(dmRoleID);
            if (!guild.members.resolve(camp.DM).roles.cache.some(r => (r.position > campRoleMinPos && r.position < campRoleMaxPos)))
                guild.members.resolve(camp.DM).roles.add(noCampRoleID);
        }
        for (p of camp.players) {
            let player = await guild.members.resolve(p.id);
            if (!player.roles.cache.some(r => (r.position > campRoleMinPos && r.position < campRoleMaxPos)))
                await player.roles.add(noCampRoleID);
        };
        
        let reportChannel = message.channel || message.author.dmChannel || await message.author.createDM();
        await reportChannel.send({embeds: [embed.setDescription("Campaign archived.")]});
    },
};