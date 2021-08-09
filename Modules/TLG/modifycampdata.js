const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['mcd'];

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
    permission: 'moderators',
    userPermissionList: [],
    botPermissionList: [],
    minArguments: 2,
    
    description: 'Edit the data of a campaign in database. It does not affect the channels and role.\nOnly use this to fix incorrect data.',
    usage: "`<commandname> [...<field> <value>]`\n\n" +
        "The options are:\n`--name`/`-n` \n`--type`/`-t`\n`--state`/`-s`\n`--dungeonmaster`/`--dm`/`-m` \n`--roleplaychannel`/`--rc`/`-p` \n" +
        "`--discussionchannel`/`--dc`/`-c` \n`--role`/`-r` \n`--description`/`--desc`/`-d`\n`--notes`/`--note`/`-o`.\n\n" +
        "Make sure the campaign's name, DM, role and channels are always present.\n\n" +
        "If `--type` is anything different than `os`, or no `--type` at all, it will be a full camp.\n\n" +
        '`--state` must be `1`/`"Finding players"`, `2`/`"Waiting for start"`, `3`/`Running` or `4`/`Paused` (DO include the double quotes).\n\n' +
        '`<newvalue>`s should be wrapped in double quotes (`"`) if it contains a space. Any double quotes within `<newvalue>`s should be doubled (`""`).\n\n',

    async execute(client, message, args, joined, embed) {
        var campList = await CampModel.find({});
        var camp = campList.find(c => c.name.toLowerCase().includes(args[0].toLowerCase()));
        if (!camp) {
            embed.setDescription(`There is no campaign named \`${args[0]}\`.`);
            return message.channel.send({embeds: [embed]});
        };
        
        embed.setTitle(camp.name)
            .addField("Type", camp.isOS ? "Oneshot" : "Full", true)
            .addField("State", camp.state, true)
            .addField("DM", `<@!${camp.DM}>`, true)
            .addField("Roleplay Channel", `<#${camp.roleplayChannel}>`, true)
            .addField("Discuss Channel", `<#${camp.discussChannel}>`, true)
            .addField("Role", `<@&${camp.role}>`, true)
            .addField("Players", camp.players.length ? `| <@!${camp.players.map(p => p.id).join('> | <@!')}> |` : 'None');
        
        var tlg = client.util.reloadFile('@data/tlg.json');
        const guild = client.guilds.resolve(tlg.id);

        for (i = 1; i < args.length; i += 2) {
            if (!args[i+1] || args[i+1].match(/^-[montdpcrs-]/i))
                continue;
            switch (args[i].toLowerCase()) {
                case '-n':
                case '--name':
                    camp.name = args[i+1];
                    break;
                case '-t':
                case '--type':
                    camp.isOS = args[i+1].toLowerCase() == 'os';
                    break;
                case '-m':
                case '--dm':
                case '--dungeonmaster':
                    let dm = guild.members.resolve(client.util.user(message.guild, args[i+1]));
                    if (dm) camp.DM = dm.id;
                    else {
                        embed.setDescription('Could not find the DM.');
                        message.channel.send({embeds: [embed]});
                        return null;
                    }
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
                case '-p':
                case '--rc':
                case '--roleplaychannel':
                    let rpCh = client.util.channel(message.guild, args[i+1]);
                    if (rpCh) camp.roleplayChannel = rpCh.id;
                    else {
                        embed.setDescription('Could not find the roleplay channel.');
                        message.channel.send({embeds: [embed]});
                        return null;
                    }
                    break;
                case '-c':
                case '--dc':
                case '--discussionchannel':
                    let dcCh = client.util.channel(message.guild, args[i+1]);
                    if (dcCh) camp.discussChannel = dcCh.id;
                    else {
                        embed.setDescription('Could not find the discussion channel.');
                        message.channel.send({embeds: [embed]});
                        return null;
                    }
                    break;
                case '-r':
                case '--role':
                    let role = client.util.role(message.guild, args[i+1]);
                    if (role) camp.role = role.id;
                    else {
                        embed.setDescription('Could not find the discussion channel.');
                        message.channel.send({embeds: [embed]});
                        return null;
                    }
                    break;
                case '-s':
                case '--state':
                    let newState = stateMap.get(args[i+1]);
                    if (!newState) newState = Array.from(stateMap.values()).find(s => s.toLowerCase().includes(args[i+1].toLowerCase()));
                    if (!newState) newState = '2';
                    camp.state = newState;
                    break;
                default:
                    embed = client.util.newReturnEmbed(message);
                    embed.setDescription(`Unexpected field \`${args[i]}\`` + '. Please insert `--name`/`-n`, `--dungeonmaster`/`-m`, `--description`/`--desc`/`-d`, `--notes`/`--note`/`-o`, and `--type`/`-t`.');
                    message.channel.send({embeds: [embed]});
                    return null;
            }
        }
        if (!camp.DM || !camp.name || !camp.roleplayChannel || !camp.discussChannel || !camp.role) {
            embed = client.util.newReturnEmbed(message);
            embed.setDescription("Not enough information. Please make sure the campaign's name, dungeon master, role and channels are provided.");
            message.channel.send({embeds: [embed]});
            return null;
        }
    
        embed.fields.find(f => f.name == "Type").value = `${camp.isOS ? "Oneshot" : "Full"}`;
        embed.fields.find(f => f.name == "DM").value = `${guild.members.resolve(camp.DM)}`;
        embed.fields.find(f => f.name == "Role").value = `<@&${camp.role}>`;
        embed.fields.find(f => f.name == "Roleplay Channel").value = `<#${camp.roleplayChannel}>`;
        embed.fields.find(f => f.name == "Discuss Channel").value = `<#${camp.discussChannel}>`;
        embed.fields.find(f => f.name == "State").value = camp.state;
        if (camp.description) embed.addField("Description", camp.description);
        if (camp.notes) embed.addField("Notes", camp.notes);
        
        await CampModel.updateOne({ _id: camp.id}, camp);
        embed.setDescription('Campaign data added successfully. Please recheck:');
        message.channel.send({embeds: [embed]});
    },
};