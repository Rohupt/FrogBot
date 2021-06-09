const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['acd'];

const CampModel = require('@data/Schema/camp-schema.js');
const stateMap = new Map().set('1', 'Finding players').set('2', 'Waiting for start').set('3', 'Running');

function createCampData(client, message, args, embed, guild) {
    const newCamp = {
        name: "",
        isOS: false,
        DM: "",
        role: "",
        state: "Unknown",
        description: "",
        notes: "",
        roleplayChannel: "",
        discussChannel: "",
        players: []
    };

    for (i = 0; i < args.length; i += 2) {
        if (!args[i+1] || args[i+1].match(/^-[montdpcrs-]/i))
            continue;
        switch (args[i].toLowerCase()) {
            case '-n':
            case '--name':
                newCamp.name = args[i+1];
                break;
            case '-t':
            case '--type':
                newCamp.isOS = args[i+1].toLowerCase() == 'os';
                break;
            case '-m':
            case '--dm':
            case '--dungeonmaster':
                let dm = guild.members.resolve(client.util.user(message, args[i+1]));
                if (dm) newCamp.DM = dm.id;
                else {
                    embed.setDescription('Could not find the DM.');
                    message.channel.send(embed);
                    return null;
                }
                break;
            case '-d':
            case '--description':
            case '--desc':
                newCamp.description = args[i+1];
                break;
            case '-o':
            case '--note':
            case '--notes':
                newCamp.notes = args[i+1];
                break;
            case '-p':
            case '--rc':
            case '--roleplaychannel':
                let rpCh = client.util.channel(message, args[i+1]);
                if (rpCh) newCamp.roleplayChannel = rpCh.id;
                else {
                    embed.setDescription('Could not find the roleplay channel.');
                    message.channel.send(embed);
                    return null;
                }
                break;
            case '-c':
            case '--dc':
            case '--discussionchannel':
                let dcCh = client.util.channel(message, args[i+1]);
                if (dcCh) newCamp.discussChannel = dcCh.id;
                else {
                    embed.setDescription('Could not find the discussion channel.');
                    message.channel.send(embed);
                    return null;
                }
                break;
            case '-r':
            case '--role':
                let role = client.util.role(message, args[i+1]);
                if (role) newCamp.role = role.id;
                else {
                    embed.setDescription('Could not find the discussion channel.');
                    message.channel.send(embed);
                    return null;
                }
                break;
            case '-s':
            case '--state':
                let newState = stateMap.get(args[i+1]);
                if (!newState) newState = Array.from(stateMap.values()).find(s => s.toLowerCase().includes(args[i+1].toLowerCase()));
                if (!newState) newState = '2';
                newCamp.state = newState;
                break;
            default:
                embed = client.util.newReturnEmbed(message);
                embed.setDescription(`Unexpected field \`${args[i]}\`` + '. Please insert `--name`/`-n`, `--dungeonmaster`/`-m`, `--description`/`--desc`/`-d`, `--notes`/`--note`/`-o`, and `--type`/`-t`.');
                message.channel.send(embed);
                return null;
        }
    }
    if (!newCamp.DM || !newCamp.name || !newCamp.roleplayChannel || !newCamp.discussChannel || !newCamp.role) {
        embed = client.util.newReturnEmbed(message);
        embed.setDescription("Not enough information. Please make sure the campaign's name, dungeon master, role and channels are provided.");
        message.channel.send(embed);
        return null;
    }

    let playersField = "|";
    let players = guild.members.cache.filter(mem => mem.roles.cache.find(r => r.id == newCamp.role) && mem.id != newCamp.DM);
    if (players) {
        newCamp.players = players.map(player => player.id);
        players.forEach(player => playersField += ` ${guild.members.resolve(player)} |`);
        embed.fields.find(f => f.name == "Players").value = newCamp.players.length ? playersField : "None";
    }

    embed.setTitle(newCamp.name);
    embed.fields.find(f => f.name == "Type").value = `${newCamp.isOS ? "Oneshot" : "Full"}`;
    embed.fields.find(f => f.name == "DM").value = `${guild.members.resolve(newCamp.DM)}`;
    embed.fields.find(f => f.name == "Role").value = `<@&${newCamp.role}>`;
    embed.fields.find(f => f.name == "Roleplay Channel").value = `<#${newCamp.roleplayChannel}>`;
    embed.fields.find(f => f.name == "Discuss Channel").value = `<#${newCamp.discussChannel}>`;
    embed.fields.find(f => f.name == "State").value = newCamp.state;
    if (newCamp.description) embed.addField("Description", newCamp.description);
    if (newCamp.notes) embed.addField("Notes", newCamp.notes);
    return newCamp;
}

module.exports = {
    name, aliases,
    module: mod,
    channelType: 0, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'moderators',
    userPermissionList: [],
    botPermissionList: [],
    minArguments: 10,
    
    description: 'Register an existing camp to the database.',
    usage: "`<commandname> [...<field> <value>]`\n\n" +
        "The options include:\n`--name`/`-n` ⚠\n`--type`/`-t`\n`--state`/`-s`\n`--dungeonmaster`/`--dm`/`-m` ⚠\n`--roleplaychannel`/`--rc`/`-p` ⚠\n" +
        "`--discussionchannel`/`--dc`/`-c` ⚠\n`--role`/`-r` ⚠\n`--description`/`--desc`/`-d`\n`--notes`/`--note`/`-o`.\n\n" +
        "⚠ means required. If `--type` is anything different than `os`, or no `--type` at all, it will be a full camp.\n\n" +
        '`--state` must be `1`/`"Finding players"`, `2`/`"Waiting for start"`, or `3`/`Running` (DO include the double quotes).\n\n' +
        '`<newvalue>`s should be wrapped in double quotes (`"`) if it contains a space. Any double quotes within `<newvalue>`s should be doubled (`""`).\n\n' +
        'The bot will automatically find the players based on the role provided.\n\n',
    example: '<commandname>\n--name "A Vampire Named ""Aglio"""\n--dm FrogBot\n--type os\n-s Running\n' +
        '--rc #roleplay\n--dc #discussion\n--role @role\n-d "A story about a vampire who loves garlics."\n' +
        '-o "- Level: 3-8\n\t- All books accepted\n\t- Newbie DM, please gentle\n\t- ""Bonus"" for being a troll."',

    async execute(client, message, args, joined, embed) {
        embed.setTitle("New camp creation")
            .addField("Type", `None`, true)
            .addField("State", "Creating", true)
            .addField("DM", `Not set yet`, true)
            .addField("Roleplay Channel", `None`, true)
            .addField("Discuss Channel", `None`, true)
            .addField("Role", `None`, true)
            .addField("Players", "No one yet");
        
        var tlg = client.util.reloadFile('@data/tlg.json');
        const guild = client.guilds.resolve(tlg.id);

        const newCamp = createCampData(client, message, args, embed, guild);
        if (!newCamp) return;

        await CampModel.create(newCamp);
        embed.setDescription('Campaign data added successfully. Please recheck:');
        message.channel.send(embed);
    },
};