const Discord = require('discord.js');
const {random} = require('mathjs');
const {sep} = require('path');
const ejf = require('edit-json-file');

const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name, 'mcp'];

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'dungeonmasters',
    
    description: 'Modify the player list of a campaign.',

    async execute(client, message, args) {
        const embed = new Discord.MessageEmbed();
        const user = client.util.user;
        embed.setAuthor(message.member.nickname ? message.member.nickname : message.author.username, message.author.avatarURL())
            .setColor(random([3], 256));

        delete require.cache[require.resolve('../../Data/tlg.json')];
        var tlg = require('../../Data/tlg.json');
        let tlgEdit = ejf('./Data/tlg.json', {
            stringify_width: 4,
            autosave: true
        });
        const guild = client.guilds.resolve(tlg.id);
        
        const camp = tlg.campList.find(c => c.name.toLowerCase().includes(args[0].toLowerCase()));
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
        removeList.forEach(mem => {
            mem.roles.remove(camp.role);
            if (!mem.roles.cache.some(r => (r.position > campRoleMinPos && r.position < campRoleMaxPos)))
                mem.roles.add(noCampRoleID);
            if (camp.players.includes(mem.id))
                camp.players.splice(camp.players.indexOf(mem.id), 1);
        });
        addList.forEach(mem => {
            mem.roles.add(camp.role);
            mem.roles.remove(tlg.noCampRoleID);
            if (!camp.players.includes(mem.id))
                camp.players.push(mem.id);
        });
        tlgEdit.set(`campList.${campIndex}.players`, camp.players);

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