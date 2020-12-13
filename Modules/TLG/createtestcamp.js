const Discord = require('discord.js');
const {sep} = require('path');
const {random} = require('mathjs');
const ejf = require('edit-json-file');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name, 'ctc'];

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'moderators',
    
    description: 'Create a test camp, for bot developing purposes',

    async execute(client, message, args) {
        const pos = {
            osRpChannel : function() {
                delete require.cache[require.resolve('../../Data/tlg.json')];
                let tlg = require('../../Data/tlg.json');
                return Array.from(client.guilds.cache.get(tlg.id).channels.cache.values())
                    .filter(ch => (ch.parentID == tlg.roleplayCat && ch.name.startsWith('os')))
                    .sort((a, b) => {return b.position - a.position})[0]
                    .position;
            },
            osDiscChannel : function() {
                delete require.cache[require.resolve('../../Data/tlg.json')];
                let tlg = require('../../Data/tlg.json');
                return Array.from(client.guilds.cache.get(tlg.id).channels.cache.values())
                    .filter(ch => (ch.parentID == tlg.discussCat && ch.name.startsWith('os')))
                    .sort((a, b) => {return b.position - a.position})[0]
                    .position;
            },
            osRole : function() {
                delete require.cache[require.resolve('../../Data/tlg.json')];
                let tlg = require('../../Data/tlg.json');
                return Array.from(client.guilds.cache.get(tlg.id).roles.cache.values())
                    .filter(r => r.name.startsWith('OS '))
                    .sort((a, b) => {return b.position - a.position})[0]
                    .position;
            },
            fullRpChannel : function() {
                delete require.cache[require.resolve('../../Data/tlg.json')];
                let tlg = require('../../Data/tlg.json');
                return Array.from(client.guilds.cache.get(tlg.id).channels.cache.values())
                    .filter(ch => (ch.parentID == tlg.roleplayCat && !ch.name.startsWith('os')))
                    .sort((a, b) => {return b.position - a.position})[0]
                    .position;
            },
            fullDiscChannel : function() {
                delete require.cache[require.resolve('../../Data/tlg.json')];
                let tlg = require('../../Data/tlg.json');
                return Array.from(client.guilds.cache.get(tlg.id).channels.cache.values())
                    .filter(ch => (ch.parentID == tlg.discussCat && !ch.name.startsWith('os')))
                    .sort((a, b) => {return b.position - a.position})[0]
                    .position;
            },
            fullRole : function() {
                delete require.cache[require.resolve('../../Data/tlg.json')];
                let tlg = require('../../Data/tlg.json');
                return Array.from(client.guilds.cache.get(tlg.id).roles.cache.values())
                    .filter(r => r.name.startsWith('_'))
                    .sort((a, b) => {return b.position - a.position})[2]
                    .position + 2;
            },
        };
        
        delete require.cache[require.resolve('../../Data/tlg.json')];
        var tlg = require('../../Data/tlg.json');
        let tlgEdit = ejf('./Data/tlg.json', {
            stringify_width: 4,
            autosave: true
        });

        const guild = client.guilds.resolve(tlg.id);
        const isOS = args.length ? args[0].toLowerCase() == "os" : false;
        
        const newCamp = {
            name: `ValderBot Test Camp ${Math.floor(random(10000, 100000))}`,
            isOS: isOS,
            DM: "557993979015331843",
            role: "",
            state: "Waiting for start",
            description: "Test camp",
            notes: "",
            roleplayChannel: "",
            discussChannel: "",
            players: []
        };

        var rpChPos, dcChPos, rolePos;
        if (isOS) {
            rpChPos = pos.osRpChannel() + 1;
            dcChPos = pos.osDiscChannel() + 1;
            rolePos = pos.osRole();
            newCamp.name = "OS " + newCamp.name;
        } else {
            rpChPos = pos.fullRpChannel() + 1;
            dcChPos = pos.fullDiscChannel() + 1;
            rolePos = pos.fullRole();
        };
        const chName = newCamp.name.split(/ +/).join('-').toLowerCase();

        var rpCh, dcCh, role;
        try {
            await guild.roles.create({
                data: {
                    name: newCamp.name,
                    position: rolePos,
                    mentionable: true
                }
            }).then(r => role = r);
            await guild.channels.create(chName, {
                parent: tlg.discussCat,
                position: dcChPos,
                permissionOverwrites: guild.channels.resolve(tlg.discussCat).permissionOverwrites,
            }).then(ch => {
                dcCh = ch;
                dcCh.setPosition(dcChPos);
                dcCh.createOverwrite(role.id, {'VIEW_CHANNEL': true});
                dcCh.createOverwrite(newCamp.DM, {'SEND_MESSAGES': true, 'MANAGE_MESSAGES': true});
            });
            await guild.channels.create(chName, {
                parent: tlg.roleplayCat,
                position: rpChPos,
                permissionOverwrites: guild.channels.resolve(tlg.roleplayCat).permissionOverwrites,
            }).then(ch => {
                rpCh = ch;
                rpCh.setPosition(rpChPos);
                rpCh.createOverwrite(role.id, {'VIEW_CHANNEL': true});
                rpCh.createOverwrite(newCamp.DM, {'SEND_MESSAGES': true, 'MANAGE_MESSAGES': true});
            });
        } catch (error) {
            console.error(error);
            message.reply("...oops, seems like there is an error. Creation incomplete.");
            return message.channel.send(`\`\`\`\n${error}\n\`\`\``);
        }

        newCamp.role = role.id;
        newCamp.roleplayChannel = rpCh.id;
        newCamp.discussChannel = dcCh.id;
        
        tlg.campList.push(newCamp);
        tlgEdit.set("campList", tlg.campList);
        guild.members.resolve(newCamp.DM).roles.add([role, guild.roles.resolve(tlg.dmRoleID)]);
        rpCh.send(`${role} Đây là kênh roleplay.`);
        dcCh.send(`${role} Đây là kênh thảo luận.`);

        message.reply(`test camp created. Role: ${role}. Roleplay channel: ${rpCh}. Discuss channel: ${dcCh}.`);
    },
};