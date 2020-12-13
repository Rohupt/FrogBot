const Discord = require('discord.js');
const {random} = require('mathjs');
const {sep} = require('path');
const ejf = require('edit-json-file');

const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name, 'mci'];

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'dungeonmasters',
    
    description: 'Modify the information of a campaign.',

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
        
        if (args.length < 3) {
            embed.setDescription("There are not enough arguments to perform this command.");
            return message.channel.send(embed);
        };
        
        const camp = tlg.campList.find(c => c.name.toLowerCase().includes(args[0].toLowerCase()));
        if (!camp) {
            embed.setDescription(`There is no campaign named \`${args[0]}\`.`);
            return message.channel.send(embed);
        };
        const campIndex = tlg.campList.indexOf(camp);
        embed.setTitle(camp.name);
        if (message.author.id != camp.DM && !message.member.roles.cache.some(r => r.id == tlg.modRoleID) && !message.member.hasPermission('ADMINISTRATOR')) {
            embed.setDescription("You are not the Dungeon Master of this camp, nor a moderator.\nYou cannot use this command.");
            return message.channel.send(embed);
        };
        
        const stateMap = new Map().set('1', 'Finding players').set('2', 'Waiting for start').set('3', 'Running');
        switch (args[1]) {
            case 'name':
                camp.name = args[2];
                let rpCh = message.guild.channels.resolve(camp.roleplayChannel);
                let dcCh = message.guild.channels.resolve(camp.discussChannel);
                let role = message.guild.roles.resolve(camp.role);
                if (camp.isOS) {
                    let chName = 'os ' + camp.name;
                    rpCh.setName(chName);
                    dcCh.setName(chName);
                    role.setName(`OS ${camp.name}`);
                } else {
                    rpCh.setName(camp.name);
                    dcCh.setName(camp.name);
                    role.setName(camp.name);
                };
                break;
            case 'state':
                let newState = stateMap.get(args[2]);
                if (!newState) newState = Array.from(stateMap.values()).find(s => s.toLowerCase().includes(args[2].toLowerCase()));
                if (!newState) {
                    embed.setDescription('No new state provided or wrong argument. Modification canceled.');
                    return message.channel.send(embed);
                };
                camp.state = newState;
                break;
            case 'description':
            case 'desc':
                camp.description = args[2];
                break;
            case 'note':
            case 'notes':
                camp.notes = args[2];
                break;
            default:
                embed.setDescription('Unexpected field. Please insert `name`, `state`, `description`/`desc` or `notes`/`note`.');
                return message.channel.send(embed);
        };
        tlgEdit.set(`campList.${campIndex}`, camp);
        var players = '|';
        camp.players.forEach(p => players += ` ${message.guild.members.resolve(p)} |`);
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