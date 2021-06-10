const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['camp', 'campaigns', 'campinfo'];

const {id: guildID} = require('@data/tlg.json')
const PAGELINES = 20;
const CampModel = require('@data/Schema/camp-schema.js');
const stateMap = new Map([
    ['1', 'Finding players'],
    ['2', 'Waiting for start'],
    ['3', 'Running'],
    ['4', 'Paused']
]);

function filterCampList(campList, client, message, args, joined) {
    if (!campList.length || !args.length) return campList;
    let result = campList;

    if (args.find(arg => arg.startsWith('-'))) {
        if (args[0].toLowerCase() == '--this')
            return result.filter(camp => (camp.discussChannel == message.channel.id || camp.roleplayChannel == message.channel.id))
        let firstFilterIndex = args.findIndex(arg => arg.startsWith('-'));
        if (firstFilterIndex > 0)
            result = result.filter(camp => camp.name.toLowerCase().contains(args.slice(firstFilterIndex).join(' ').toLowerCase()));
        for (let i = firstFilterIndex; i < args.length; i += 2) {
            if (!args[i+1] || args[i+1].match(/^-[mnstp-]/i))
                continue;
            switch (args[i].toLowerCase()) {
                case '--name':
                case '-n':
                    result = result.filter(camp => camp.name.toLowerCase().contains(args[i+1].toLowerCase()));
                    break;
                case '--type':
                case '-t':
                    let typeFilter = args[i+1].toLowerCase() == 'os' ? true : args[i+1].toLowerCase() == 'full' ? false : null;
                    if (typeFilter === null)
                        throw new Error("Campaign type must be either `os` or `full`.");
                    result = result.filter(camp => camp.type == typeFilter);
                    break;
                case '--state':
                case '-s':
                    let stateFilter = stateMap.get(args[i+1]);
                    if (!stateFilter)
                        stateFilter = Array.from(stateMap.values()).find(s => s.toLowerCase().includes(args[i+1].toLowerCase()));
                    if (!stateFilter)
                        throw new Error('Invalid state. Please enter `1`/`"Finding players"`, `2`/`"Waiting for start"`, `3`/`Running` or `4`/`Paused`');
                    result = result.filter(camp => camp.state == stateFilter);
                    break;
                case '--dungeonmaster':
                case '--dm':
                case '-m':
                    let dmFilter = client.util.user(client.guilds.resolve(guildID), args[i+1]);
                    if (!dmFilter)
                        throw new Error('Could not find the dungeon master.');
                    result = result.filter(camp => camp.DM == dmFilter.id);
                    break;
                case '-p':
                case '--page':
                    break;
                default:
                    throw new Error(`Unexpected field \`${args[i]}\`` + '. Acceptable filters are `--name`/`-n`, `--dungeonmaster`/`-m`, `--state`/`-s` and `--type`/`-t`.');                    
            }
        }
    } else {
        result = result.filter(camp => camp.name.toLowerCase().includes(joined.toLowerCase()));
    }
    return result;
}

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'everyone',
    userPermissionList: [],
    botPermissionList: [],
    minArguments: 0,
    
    description: 'View a list of campaigns, or a particular campaign by name.',
    usage: '`<commandname>` View campaigns list\n\n' +
        '`<commandname> --this` View campaign info while in its own discussion or roleplay channel\n\n' +
        '`<commandname> (<name>) [...<field> <value>]` View list of campaigns with filter\n' +
        "The options are: `--name`/`-n`, `--type`/`-t`, `--state`/`-s`, `--dungeonmaster`/`--dm`/`-m`\n" +
        'The arguments should be wrapped in double quotes if it contains a space.\n' +
        'You can use the options multiple times, the filters will be stacked (AND filter).\n\n' +
        'If there is more than one page, you can add the option `-p`/`--page` to view a certain page.',
    example: '<commandname> -t "Finding players" //List all camps which are looking for players\n' +
        '<commandname> -t Finding //ditto\n' +
        '<commandname> Aglio --dm FrogBot',

    async execute(client, message, args, joined, embed) {

        var campList = await CampModel.find({});
        let result;
        try {
            result = filterCampList(campList, client, message, args, joined);
        } catch (error) {
            return message.channel.send(embed.setDescription(error));
        }
        
        if (!result.length)
            return message.channel.send(embed.setDescription(args.length ? `No results found.` : `There is no campaign available.`));
        
        if (result.length == 1) {
            let camp = result[0];
            var players = '|';
            camp.players.forEach(p => players += ` ${message.guild.members.resolve(p.id)} |`);
            embed.setTitle(camp.name)
                .addField("Type", camp.isOS ? "Oneshot" : "Full", true)
                .addField("State", camp.state, true)
                .addField("DM", `<@!${camp.DM}>`, true)
                .addField("Roleplay Channel", `<#${camp.roleplayChannel}>`, true)
                .addField("Discuss Channel", `<#${camp.discussChannel}>`, true)
                .addField("Role", camp.role ? `<@&${camp.role}>` : "none", true)
                .addField("Players", camp.players.length ? players : "No one yet");
            if (camp.description) embed.addField("Description", camp.description);
            if (camp.notes) embed.addField("Notes", camp.notes);
            return message.channel.send(embed);
        }
        
        result = result.sort((a, b) => a.isOS == b.isOS ? a.name.localeCompare(b.name, 'vi', { sensitivity: "accent" }) : a.isOS ? -1 : 1);

        const pages = Math.ceil(result.length / PAGELINES);
        const pageFilter = arg => (arg.toLowerCase() == '-p' || arg.toLowerCase() == '--page');
        let page;
        if (args.find(pageFilter))
            if (args.findIndex(pageFilter) + 1 < args.length) {
                page = Number.parseInt(args[args.findIndex(pageFilter) + 1]);
                if (page === NaN || page > pages || page < 1)
                    return (message.channel.send(embed.setDescription('Invalid page number.')));
            } else return (message.channel.send(embed.setDescription('Please provide page number.')));
        else page = 1;
        
        let desc = '';
        for (let i = PAGELINES * page - PAGELINES; i < Math.min(result.length, PAGELINES * page); i++)
            desc += `${i + 1}. \`${result[i].isOS ? '(OS) ' : ''}${result[i].name}\`\n`;
        embed.setTitle('Campaigns list')
            .setDescription(desc)
            .setFooter(`Page ${page} of ${pages}`);
        return message.channel.send(embed);
    },
};