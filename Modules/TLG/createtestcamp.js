const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['ctc'];

const {random} = require('mathjs');
const CampModel = require('@data/Schema/camp-schema.js');

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'developer',
    userPermissionList: [],
    botPermissionList: ['MANAGE_CHANNELS', 'MANAGE_ROLES'],
    minArguments: 0,
    
    description: 'Create a test campaign.',
    usage: `\`<commandname>\` Create a full camp\n` +
        `\`<commandname> os\` Create an oneshot\n`,

    async execute(client, message, args, joined, embed) {
        const pos = {
            osRpChannel : function() {
                let tlg = client.util.reloadFile('@data/tlg.json');
                return Array.from(client.guilds.cache.get(tlg.id).channels.cache.values())
                    .filter(ch => (ch.parentId == tlg.roleplayCat && ch.name.startsWith('os')))
                    .sort((a, b) => {return b.position - a.position})[0]
                    .position;
            },
            osDiscChannel : function() {
                let tlg = client.util.reloadFile('@data/tlg.json');
                return Array.from(client.guilds.cache.get(tlg.id).channels.cache.values())
                    .filter(ch => (ch.parentId == tlg.discussCat && ch.name.startsWith('os')))
                    .sort((a, b) => {return b.position - a.position})[0]
                    .position;
            },
            osRole : function() {
                let tlg = client.util.reloadFile('@data/tlg.json');
                return Array.from(client.guilds.cache.get(tlg.id).roles.cache.values())
                    .filter(r => r.name.startsWith('OS '))
                    .sort((a, b) => {return b.position - a.position})[0]
                    .position;
            },
            fullRpChannel : function() {
                let tlg = client.util.reloadFile('@data/tlg.json');
                return Array.from(client.guilds.cache.get(tlg.id).channels.cache.values())
                    .filter(ch => (ch.parentId == tlg.roleplayCat && !ch.name.startsWith('os')))
                    .sort((a, b) => {return b.position - a.position})[0]
                    .position;
            },
            fullDiscChannel : function() {
                let tlg = client.util.reloadFile('@data/tlg.json');
                return Array.from(client.guilds.cache.get(tlg.id).channels.cache.values())
                    .filter(ch => (ch.parentId == tlg.discussCat && !ch.name.startsWith('os')))
                    .sort((a, b) => {return b.position - a.position})[0]
                    .position;
            },
            fullRole : function() {
                let tlg = client.util.reloadFile('@data/tlg.json');
                return Array.from(client.guilds.cache.get(tlg.id).roles.cache.values())
                    .filter(r => r.name.startsWith('_'))
                    .sort((a, b) => {return b.position - a.position})[2]
                    .position + 1;
            },
        };
        
        let tlg = client.util.reloadFile('@data/tlg.json');

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

        let rpChPos = newCamp.isOS ? (pos.osRpChannel() + 1) : (pos.fullRpChannel() + 1);
        let dcChPos = newCamp.isOS ? (pos.osDiscChannel() + 1) : (pos.fullDiscChannel() + 1);
        let rolePos = newCamp.isOS ? pos.osRole() : pos.fullRole();
        const chName = client.util.getCampNames(newCamp).chName;

        var rpCh, dcCh, role;
        try {
            await guild.roles.create({
                name: client.util.getCampNames(newCamp).roleName,
                position: rolePos,
                mentionable: true
            }).then(r => role = r);
            await guild.channels.create(chName, {
                parent: tlg.discussCat,
                position: dcChPos,
                permissionOverwrites: guild.channels.resolve(tlg.discussCat).permissionOverwrites.cache,
            }).then(async ch => {
                dcCh = ch;
                dcCh.setPosition(dcChPos);
                await dcCh.permissionOverwrites.create(role, {'VIEW_CHANNEL': true});
                await message.channel.send(`<@!${newCamp.DM}>`);
                await console.log(client.users.resolve(newCamp.DM));
                await dcCh.permissionOverwrites.create(newCamp.DM, {'SEND_MESSAGES': true, 'MANAGE_MESSAGES': true});
            });
            await guild.channels.create(chName, {
                parent: tlg.roleplayCat,
                position: rpChPos,
                permissionOverwrites: guild.channels.resolve(tlg.roleplayCat).permissionOverwrites.cache,
            }).then(ch => {
                rpCh = ch;
                rpCh.setPosition(rpChPos);
                rpCh.permissionOverwrites.create(role, {'VIEW_CHANNEL': true});
                rpCh.permissionOverwrites.create(newCamp.DM, {'SEND_MESSAGES': true, 'MANAGE_MESSAGES': true});
            });
        } catch (error) {
            if (role && client.util.role(message.guild, role.id))
                role.delete();
            console.error(error);
            message.reply("...oops, seems like there is an error. Creation incomplete.");
            return message.channel.send(`\`\`\`\n${error}\n\`\`\``);
        }

        newCamp.role = role.id;
        newCamp.roleplayChannel = rpCh.id;
        newCamp.discussChannel = dcCh.id;
        
        CampModel.create(newCamp);
        let dm = guild.members.resolve(newCamp.DM);
        await dm.roles.add([role]);
        if (!dm.roles.cache.has(tlg.dmRoleID))
            await dm.roles.add([tlg.dmRoleID]);
        rpCh.send(`${role} Đây là kênh roleplay.`);
        dcCh.send(`${role} Đây là kênh thảo luận.`);

        message.channel.send({embeds: [embed.setDescription(`Test camp created.\nRole: ${role}.\nRoleplay channel: ${rpCh}.\nDiscuss channel: ${dcCh}.`)]});
    },
};