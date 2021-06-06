const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['mcp'];

const CampModel = require('@data/Schema/camp-schema.js');

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'dungeonmasters',
    userPermissionList: [],
    botPermissionList: ['MANAGE_CHANNELS', 'MANAGE_ROLES'],
    minArguments: 2,
    
    description: 'Add or remove players of a campaign.',
    usage: `\`<commandname> <campaign> + <addlist> - <removelist>\`\n` +
        "Names should be wrapped in double quotes if contains a space.\n" +
        "You can swap `+` and `-` signs and the corresponding lists, but the signs must be separated from any names by a space.\n" +
        "If both `+` and `-` are omitted, players in the list will be removed, and non-players in the list will be added.",

    async execute(client, message, args, joined, embed) {
        var tlg = client.util.reloadFile('@data/tlg.json');
        const guild = client.guilds.resolve(tlg.id);
        var campList = await CampModel.find({});
        
        const camp = campList.find(c => c.name.toLowerCase().includes(args[0].toLowerCase()));
        if (!camp) {
            embed.setDescription(`There is no campaign with such name.`);
            return message.channel.send(embed);
        };
        const campIndex = tlg.campList.indexOf(camp);
        if (message.author.id != camp.DM && !message.member.roles.cache.some(r => r.id == tlg.modRoleID) && !message.member.hasPermission('ADMINISTRATOR')) {
            embed.setDescription("You are not the Dungeon Master of this camp, nor a moderator.\nYou cannot use this command.");
            return message.channel.send(embed);
        };
        
        if (args.length <= 1) {
            embed.setDescription("Please provide at least some names.");
            return message.channel.send(embed);
        };

        const aPos = args.indexOf('+'), rPos = args.indexOf('-');
        let addList = [], removeList = [];
        if (aPos == -1 && rPos == -1) {
            args.slice(1).forEach(arg => {
                if (user(message, arg))
                    if (camp.players.includes(user(message, arg).id)) removeList.push(user(message, arg));
                    else addList.push(user(message, arg));
            });
        } else if (aPos > -1 && rPos == -1) {
            args.slice(2).forEach(arg => {
                if (user(message, arg) && !camp.players.includes(user(message, arg).id))
                    addList.push(user(message, arg));
            });
        } else if (aPos == -1 && rPos > -1) {
            args.slice(2).forEach(arg => {
                if (user(message, arg) && camp.players.includes(user(message, arg).id))
                    removeList.push(user(message, arg));
            });
        } else if (aPos > -1 && rPos > -1) {
            if (aPos < rPos) {
                args.slice(aPos + 1, rPos).forEach(arg => {
                    if (user(message, arg) && !camp.players.includes(user(message, arg).id))
                        addList.push(user(message, arg));
                });
                args.slice(rPos + 1).forEach(arg => {
                    if (user(message, arg) && camp.players.includes(user(message, arg).id))
                        removeList.push(user(message, arg));
                });
            } else if (rPos < aPos) {
                args.slice(rPos + 1, aPos).forEach(arg => {
                    if (user(message, arg) && camp.players.includes(user(message, arg).id))
                        removeList.push(user(message, arg));
                });
                args.slice(aPos + 1).forEach(arg => {
                    if (user(message, arg) && !camp.players.includes(user(message, arg).id))
                        addList.push(user(message, arg));
                });
            };
        };

        const campRoleMaxPos = guild.roles.resolve(tlg.noCampRoleID).position,
            campRoleMinPos = guild.roles.resolve(tlg.advLeagueRoleCatID).position;
        for (mem of removeList) {
            await mem.roles.remove(camp.role);
            if (!mem.roles.cache.some(r => (r.position > campRoleMinPos && r.position < campRoleMaxPos)))
                await mem.roles.add(tlg.noCampRoleID);
            if (camp.players.includes(mem.id))
                camp.players.splice(camp.players.indexOf(mem.id), 1);
        };
        for (mem of addList) {
            await mem.roles.add(camp.role);
            await mem.roles.remove(tlg.noCampRoleID);
            if (!camp.players.includes(mem.id))
                camp.players.push(mem.id);
        };
        await CampModel.updateOne({ _id: camp.id }, { $set: {players: camp.players}});

        var desc = "Modification completed. Here are the results:";
        var addField = "", removeField = "", resultField = "|";
        addList.forEach(mem => addField += `${mem}\n`);
        removeList.forEach(mem => removeField += `${mem}\n`);
        camp.players.forEach(p => resultField += ` ${guild.members.resolve(p)} |`);
        embed.setTitle(camp.name).setDescription(desc)
            .addField("Players added", addField ? addField : "None", true)
            .addField("Players removed", removeField ? removeField : "None", true)
            .addField("Current players list", camp.players.length ? resultField : "None");
        message.channel.send(embed);
    },
};