const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['mci'];

const CampModel = require('@data/Schema/camp-schema.js');
const stateMap = new Map([
    ['1', 'Finding players'],
    ['2', 'Waiting for start'],
    ['3', 'Running'],
    ['4', 'Paused']
]);

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'dungeonmasters',
    userPermissionList: [],
    botPermissionList: ['MANAGE_CHANNELS', 'MANAGE_ROLES'],
    minArguments: 2,
    
    description: 'Edit the information of a campaign.',
    usage: `\`<commandname> (<campaign>) [...<field> <newvalue>]\`\n\n` + 
        "Campaign name should be wrapped in double quotes if contains a space. It can be omitted if you use the command in the campaign's own channels.\n\n" +
        "`<field>` is the key of the field to edit, currently supports `--name`/`-n`, `--state`/`-s`, `--description`/`--desc`/`-d`, `--notes`/`--note`/`-o`, and `--switchtype`/`-t`.\n\n" +
        'If `<field>` is `--state`, `<newvalue>` must be `1`/`"Finding players"`, `2`/`"Waiting for start"`, `3`/`Running` or `4`/`Paused` (DO include the double quotes).\n\n' +
        'If `<field>` is any other values, `<newvalue>` must be wrapped in double quotes if it containts any spaces or newlines; ' +
        'and any double quotes (`"`) within `<newvalue>` must be doubled (`""`).\n' +
        'For example, if you want to rename your campaign `A Vampire Named "Aglio"`, the command will be\n`<commandname> <campaignname> name "A Vampire Named ""Aglio"""`.\n\n' +
        '`--switchtype` is for changing from oneshot to full camp and vice versa, but you should NOT use this option too rapidly.',

    async execute(client, message, args, joined, embed) {
        var tlg = client.util.reloadFile('@data/tlg.json');
        var campList = await CampModel.find({});

        const pos = {
            osRpChannel : function() {
                let tlg = client.util.reloadFile('@data/tlg.json');
                return Array.from(client.guilds.cache.get(tlg.id).channels.cache.values())
                    .filter(ch => (ch.parentID == tlg.roleplayCat && ch.name.startsWith('os')))
                    .sort((a, b) => {return b.position - a.position})[0]
                    .position;
            },
            osDiscChannel : function() {
                let tlg = client.util.reloadFile('@data/tlg.json');
                return Array.from(client.guilds.cache.get(tlg.id).channels.cache.values())
                    .filter(ch => (ch.parentID == tlg.discussCat && ch.name.startsWith('os')))
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
                    .filter(ch => (ch.parentID == tlg.roleplayCat && !ch.name.startsWith('os')))
                    .sort((a, b) => {return b.position - a.position})[0]
                    .position;
            },
            fullDiscChannel : function() {
                let tlg = client.util.reloadFile('@data/tlg.json');
                return Array.from(client.guilds.cache.get(tlg.id).channels.cache.values())
                    .filter(ch => (ch.parentID == tlg.discussCat && !ch.name.startsWith('os')))
                    .sort((a, b) => {return b.position - a.position})[0]
                    .position;
            },
            fullRole : function() {
                let tlg = client.util.reloadFile('@data/tlg.json');
                return Array.from(client.guilds.cache.get(tlg.id).roles.cache.values())
                    .filter(r => r.name.startsWith('_'))
                    .sort((a, b) => {return b.position - a.position})[2]
                    .position + 2;
            },
        };
        
        let camp = null, campVar = true;
        camp = campList.find(c => c.name.toLowerCase().includes(args[0].toLowerCase()));
        if (!camp) {
            camp = campList.find(c => (c.discussChannel == message.channel.id || c.roleplayChannel == message.channel.id));
            campVar = false;
        }
        if (!camp)
            return message.channel.send(embed.setDescription("Please enter the camp name."));
        
        if (message.author.id != camp.DM && !message.member.roles.cache.some(r => r.id == tlg.modRoleID) && !message.member.hasPermission('ADMINISTRATOR')) {
            embed.setDescription("You are not the Dungeon Master of this camp, nor a moderator.\nYou cannot use this command.");
            return message.channel.send(embed);
        };
        
        embed.setTitle(camp.name);
        if (message.author.id != camp.DM && !message.member.roles.cache.some(r => r.id == tlg.modRoleID) && !message.member.hasPermission('ADMINISTRATOR')) {
            embed.setDescription("You are not the Dungeon Master of this camp, nor a moderator.\nYou cannot use this command.");
            return message.channel.send(embed);
        };
        
        let rpCh = message.guild.channels.resolve(camp.roleplayChannel);
        let dcCh = message.guild.channels.resolve(camp.discussChannel);
        let role = message.guild.roles.resolve(camp.role);
        for (let i = campVar ? 1 : 0; i < args.length; i += 2) {
            if (!['-t', '--switchtype'].includes(args[i].toLowerCase()))
                if (!args[i+1] || args[i+1].match(/^-[stond-]/i))
                    continue;
            switch (args[i].toLowerCase()) {
                case '-n':
                case '--name':
                    camp.name = args[i+1];
                    await rpCh.setName(client.util.getCampNames(camp).chName);
                    await dcCh.setName(client.util.getCampNames(camp).chName);
                    await role.setName(client.util.getCampNames(camp).roleName);
                    break;
                case '-s':
                case '--state':
                    let newState = stateMap.get(args[i+1]);
                    if (!newState) newState = Array.from(stateMap.values()).find(s => s.toLowerCase().includes(args[i+1].toLowerCase()));
                    if (!newState) {
                        embed.setDescription('No new state provided or wrong argument. Modification canceled.');
                        return message.channel.send(embed);
                    };
                    camp.state = newState;
                    break;
                case '-d':
                case '--description':
                case '--desc':
                    camp.description = args[i+1];
                    break;
                case '-o':
                case '--note':
                case '--notes':
                    camp.notes = args[i+1];
                    break;
                case '-t':
                case '--switchtype':
                    camp.isOS = !camp.isOS;
                    let rpChPos = camp.isOS ? (pos.osRpChannel() + 1) : (pos.fullRpChannel());
                    let dcChPos = camp.isOS ? (pos.osDiscChannel() + 1) : (pos.fullDiscChannel());
                    let rolePos = camp.isOS ? pos.osRole() : pos.fullRole();
                    console.log(camp.isOS);
                    console.log(rpChPos, dcChPos, rolePos);
                    dcCh.setPosition(dcChPos).then((updated) => console.log(updated.position));
                    rpCh.setPosition(rpChPos).then((updated) => console.log(updated.position));
                    await role.setPosition(rolePos).then((updated) => console.log(updated.position));
                    await rpCh.setName(client.util.getCampNames(camp).chName).then((updated) => console.log(updated.name));
                    await dcCh.setName(client.util.getCampNames(camp).chName).then((updated) => console.log(updated.name));
                    await role.setName(client.util.getCampNames(camp).roleName).then((updated) => console.log(updated.name));
                    break;
                default:
                    embed.setDescription('Unexpected field. Please insert `--name`/`-n`, `--state`/`-s`, `--description`/`--desc`/`-d`, `--notes`/`--note`/`-o`, or `--switchtype`/`-t`.');
                    return message.channel.send(embed);
            };
        }

        
        await CampModel.updateOne({ _id: camp.id }, camp);
        var players = '|';
        camp.players.forEach(p => players += ` ${message.guild.members.resolve(p.id)} |`);
        embed.setTitle(camp.name)
            .setDescription('Modification completed. Please recheck:')
            .addField("Type", camp.isOS ? "Oneshot" : "Full", true)
            .addField("State", camp.state, true)
            .addField("DM", `<@!${camp.DM}>`, true)
            .addField("Roleplay Channel", `<#${camp.roleplayChannel}>`, true)
            .addField("Discuss Channel", `<#${camp.discussChannel}>`, true)
            .addField("Role", camp.role ? `<@&${camp.role}>` : "none", true)
            .addField("Players", camp.players.length ? players : "No one yet");
        if (camp.description) embed.addField("Description", camp.description);
        if (camp.notes) embed.addField("Notes", camp.notes);
        message.channel.send(embed);
    },
};