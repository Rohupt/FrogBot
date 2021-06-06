const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['mco'];

const CampModel = require('@data/Schema/camp-schema.js');

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'dungeonmasters',
    userPermissionList: [],
    botPermissionList: ['MANAGE_CHANNELS', 'MANAGE_ROLES'],
    minArguments: 2,
    
    description: 'Add or remove observers of a campaign.\n' +
        'Observers can view the channels and talk in discussion channel, but cannot interfere in the roleplay channel.\n',
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
            embed.setDescription(`There is no campaign named \`${args[0]}\`.`);
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

        const rpCh = guild.channels.resolve(camp.roleplayChannel), dcCh = guild.channels.resolve(camp.discussChannel);
        const aPos = args.indexOf('+'), rPos = args.indexOf('-');
        let addList = [], removeList = [];
        if (aPos == -1 && rPos == -1) {
            args.slice(1).forEach(arg => {
                if (user(message, arg)) {
                    if (!camp.players.includes(user(message, arg).id)) {
                        if (rpCh.permissionOverwrites.has(user(message, arg).id)) removeList.push(user(message, arg));
                        else addList.push(user(message, arg));
                    };
                };
            });
        } else if (aPos > -1 && rPos == -1) {
            args.slice(2).forEach(arg => {
                if (user(message, arg) && !camp.players.includes(user(message, arg).id))
                    addList.push(user(message, arg));
            });
        } else if (aPos == -1 && rPos > -1) {
            args.slice(2).forEach(arg => {
                if (user(message, arg) && !camp.players.includes(user(message, arg).id))
                    removeList.push(user(message, arg));
            });
        } else if (aPos > -1 && rPos > -1) {
            if (aPos < rPos) {
                args.slice(aPos + 1, rPos).forEach(arg => {
                    if (user(message, arg) && !camp.players.includes(user(message, arg).id))
                        addList.push(user(message, arg));
                });
                args.slice(rPos + 1).forEach(arg => {
                    if (user(message, arg) && !camp.players.includes(user(message, arg).id))
                        removeList.push(user(message, arg));
                });
            } else if (rPos < aPos) {
                args.slice(rPos + 1, aPos).forEach(arg => {
                    if (user(message, arg) && !camp.players.includes(user(message, arg).id))
                        removeList.push(user(message, arg));
                });
                args.slice(aPos + 1).forEach(arg => {
                    if (user(message, arg) && !camp.players.includes(user(message, arg).id))
                        addList.push(user(message, arg));
                });
            };
        };

        removeList.forEach(mem => {
            if (rpCh.permissionOverwrites.has(mem.id))
                rpCh.permissionOverwrites.get(mem.id).delete();
            if (dcCh.permissionOverwrites.has(mem.id))
                dcCh.permissionOverwrites.get(mem.id).delete();
        });
        addList.forEach(mem => {
            if (!(mem.roles.cache.find(role => role.id == tlg.modRoleID) || mem.roles.cache.find(role => role.id == tlg.adminRoleID) || mem.user.bot)) {
                rpCh.updateOverwrite(mem, {'SEND_MESSAGES': false, 'VIEW_CHANNEL': true});
                dcCh.updateOverwrite(mem, {'VIEW_CHANNEL': true});
            }
        });
        
        var desc = "Modification completed. Here are the results:";
        var addField = "", removeField = "";
        addList.forEach(mem => addField += `${mem}\n`);
        removeList.forEach(mem => removeField += `${mem}\n`);
        embed.setTitle(camp.name).setDescription(desc)
            .addField("Observers added", addField ? addField : "None", true)
            .addField("Observers removed", removeField ? removeField : "None", true);
        message.channel.send(embed);
    },
};