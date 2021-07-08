const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['cc'];

const CampModel = require('@data/Schema/camp-schema.js');
const exitMsg = "\nYou can always type `exit` or `cancel` to cancel this process."
const timeoutMsg = "you didn't response for some time. Camp creation cancelled."
const cancelMsg = "Camp creation cancelled."

const MessageToDM = "You will take control of your campaign from here. Below are some useful commands:\n\n" +
    "`campaign`/`camp` View the campaign's details\n" +
    "`playerinfo`/`pi` View character sheet and token link\n" +
    "`modifycampplayers`/`mcp` Add or remove players to/from your campaign\n" +
    "`modifycampobservers`/`mco` Add or remove observers to/from your campaign (*)\n" +
    "`modifycampinfo`/`mci` Modify details like status and description of the campaign\n" +
    "`modifyplayerinfo`/`mpi` Modify character sheet and token link\n\n" +
    "Please remember to set your camp's status to `1`/`\"Finding players\"`, `2`/`\"Waiting for start\"`, `3`/`Running` or `4`/`Paused` (DO include the double quotes) when necessary.\n\n" +
    "**Have fun with your game! NAT 20!**";

async function createCamp(client, message, embed, guild) {
    const newCamp = {
        name: "",
        isOS: false,
        DM: "",
        role: "",
        state: "Creating",
        description: "",
        notes: "",
        roleplayChannel: "",
        discussChannel: "",
        players: []
    };

    var exit = false;
    const filter = m => m.author == message.author;
    const idle = 120000;
    
    //#region Camp's name
    var description = "What is the camp's name?\nDO NOT prefix it with `OS` if you are creating an oneshot, except when the name truly starts with `OS`.";
    var warning = "";
    embed.setDescription(warning + '**' + description + '**' + exitMsg);
    var infoMsg;
    await message.channel.send(embed).then(async (msg) => {
        infoMsg = msg;
        await message.channel.awaitMessages(filter, {idle : idle, dispose : true, max : 1, error : ['time']})
            .then(collected => {
                if (collected.first().content != 'exit' && collected.first().content != 'cancel') {
                    embed.setTitle(collected.first().content);
                    newCamp.name = collected.first().content;
                } else {
                    exit = true;
                    message.reply(cancelMsg);
                }
            }).catch(collected => {
                exit = true;
                message.reply(timeoutMsg);
            });
    });
    if (exit) return null;
    //#endregion Camp's name

    //#region Type
    description = "Is it an ONESHOT? Anything other than `yes` or `y` will be understood as `no` (i.e. it's a long camp)."
    warning = "";
    embed.setDescription(warning + '**' + description + '**' + exitMsg);
    await infoMsg.edit(embed).then(async () => {
        await message.channel.awaitMessages(filter, {idle : idle, dispose : true, max : 1, error : ['time']})
            .then(collected => {
                const content = collected.first().content;
                if (content != 'exit' && content != 'cancel') {
                    if (content.toLowerCase() == 'yes' || content.toLowerCase() == 'y')
                        newCamp.isOS = true;
                } else {
                    exit = true;
                    message.reply(cancelMsg);
                }
            }).catch(collected => {
                exit = true;
                message.reply(timeoutMsg);
            });
    });
    if (exit) return null;
    embed.fields.find(f => f.name == "Type").value = `${newCamp.isOS ? "Oneshot" : "Full"}`;
    //#endregion Type
    
    //#region Dungeon Master
    description = "Who is the Dungeon Master?"
    do {
        embed.setDescription(warning + '**' + description + '**' + exitMsg);
        warning = "Your input was not valid.\n";
        await infoMsg.edit(embed).then(async () => {
            await message.channel.awaitMessages(filter, {idle : idle, dispose : true, max : 1, error : ['time']})
                .then(collected => {
                    const content = collected.first().content;
                    if (content != 'exit' && content != 'cancel') {
                        let DM = guild.members.resolve(client.util.user(guild, collected.first().content))
                        if (DM) newCamp.DM = DM.id;
                    } else {
                        exit = true;
                        message.reply(cancelMsg);
                    }
                }).catch(collected => {
                    exit = true;
                    message.reply(timeoutMsg);
                });
        });
    } while (!newCamp.DM && !exit);
    warning = "";
    if (exit) return null;
    embed.fields.find(f => f.name == "DM").value = `${guild.members.resolve(newCamp.DM)}`;
    //#endregion Dungeon Master

    //#region Description
    description = "Please provide some description for the camp, or `next`/`none` if there is no description."
    warning = "";
    embed.setDescription(warning + '**' + description + '**' + exitMsg);
    await infoMsg.edit(embed).then(async () => {
        await message.channel.awaitMessages(filter, {idle : idle, dispose : true, max : 1, error : ['time']})
            .then(collected => {
                const content = collected.first().content;
                if (!['exit', 'cancel', 'next', 'none'].includes(content)) {
                    newCamp.description = content;
                } else if (content != 'next' && content != 'none') {
                    exit = true;
                    message.reply(cancelMsg);
                };
            }).catch(collected => {
                exit = true;
                message.reply(timeoutMsg);
            });
    });
    if (exit) return null;
    if (newCamp.description) embed.addField("Description", newCamp.description);
    //#endregion Description

    //#region Notes
    description = "Notes for player candidates, or `next`/`none` if there is no note. May include:\n"
        + "- Level bound\n- Playing schedule\n- Number of player slots\n- Restrictions\netc.";
    warning = "";
    embed.setDescription(warning + '**' + description + '**' + exitMsg);
    await infoMsg.edit(embed).then(async () => {
        await message.channel.awaitMessages(filter, {idle : idle, dispose : true, max : 1, error : ['time']})
            .then(collected => {
                const content = collected.first().content;
                if (!['exit', 'cancel', 'next', 'none'].includes(content)) {
                    newCamp.notes = content;
                } else if (content != 'next' && content != 'none') {
                    exit = true;
                    message.reply(cancelMsg);
                };
            }).catch(collected => {
                exit = true;
                message.reply(timeoutMsg);
            });
    });
    if (exit) return;
    if (newCamp.notes) embed.addField("Notes", newCamp.notes);
    //#endregion Notes

    infoMsg.delete();
    return newCamp;
}

function createCampShorthand(client, message, args, embed, guild) {
    const newCamp = {
        name: "",
        isOS: false,
        DM: "",
        role: "",
        state: "Creating",
        description: "",
        notes: "",
        roleplayChannel: "",
        discussChannel: "",
        players: []
    };

    for (i = 0; i < args.length; i += 2) {
        if (!args[i+1] || args[i+1].match(/^-[montd-]/i))
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
                let dm = guild.members.resolveID(client.util.user(args[i+1]));
                if (dm) newCamp.DM = dm;
                else {
                    embed.setDescription('Cannot find the DM.');
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
            default:
                embed = client.util.newReturnEmbed(message);
                embed.setDescription(`Unexpected field \`${args[i]}\`` + '. Please insert `--name`/`-n`, `--dungeonmaster`/`-m`, `--description`/`--desc`/`-d`, `--notes`/`--note`/`-o`, and `--type`/`-t`.');
                message.channel.send(embed);
                return null;
        }
    }
    if (!newCamp.DM || !newCamp.name) {
        embed = client.util.newReturnEmbed(message);
        embed.setDescription("Not enough information. Please make sure the campaign's name and dungeon master's identity are provided.");
        message.channel.send(embed);
        return null;
    }
    embed.setTitle(newCamp.name);
    embed.fields.find(f => f.name == "Type").value = `${newCamp.isOS ? "Oneshot" : "Full"}`;
    embed.fields.find(f => f.name == "DM").value = `${guild.members.resolve(newCamp.DM)}`;
    if (newCamp.description) embed.addField("Description", newCamp.description);
    if (newCamp.notes) embed.addField("Notes", newCamp.notes);
    return newCamp;
}

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'moderators',
    userPermissionList: [],
    botPermissionList: ['MANAGE_CHANNELS', 'MANAGE_ROLES'],
    minArguments: 0,
    
    description: 'Create a new camp.',
    usage: `\`<commandname>\` Create a campaign, step by step.\n` +
        "You will follow the instructions, enter the camp's name, type (oneshot or not), DM, descriptions and notes. " +
        "Timeout period is 120 sec per step, so please be quick.\n\n" +
        "`<commandname> [...<field> <value>]` Providing options as arguments.\n" +
        "The options include: `--name`/`-n`, `--type`/`-t`, `--dungeonmaster`/`--dm`/`-m`, `--description`/`--desc`/`-d`, and `--notes`/`--note`/`-o`.\n" +
        "`--name` and `--dungeonmaster` are compulsory. If `--type` is anything different than `os`, or no `--type` at all, it will be a full camp.\n" +
        '`<newvalue>`s should be wrapped in double quotes (`"`) if it contains a space. Any double quotes within `<newvalue>`s should be doubled (`""`).\n',
    example: '<commandname>\n--name "A Vampire Named ""Aglio"""\n--dm FrogBot\n--type os\n' +
        '-d "A story about a vampire who loves garlics."\n-o "- Level: 3-8\n\t- All books accepted\n\t- Newbie DM, please gentle\n\t- ""Bonus"" for being a troll."',

    async execute(client, message, args, joined, embed) {
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
        const newCamp = args.length > 0
            ? createCampShorthand(client, message, args, embed, guild)
            : await createCamp(client, message, embed, guild);
        if (!newCamp) {
            embed = client.util.newReturnEmbed(message);
            embed.setDescription('Creation cancelled or failed.');
            if (args.length > 0) return;
            else return message.channel.send(embed);
        }

        //#region Creating camp
        var roleName = client.util.getCampNames(newCamp).roleName;
        let rpChPos = newCamp.isOS ? (pos.osRpChannel() + 1) : (pos.fullRpChannel() + 1);
        let dcChPos = newCamp.isOS ? (pos.osDiscChannel() + 1) : (pos.fullDiscChannel() + 1);
        let rolePos = newCamp.isOS ? pos.osRole() : pos.fullRole();
        const chName = client.util.getCampNames(newCamp).chName;

        var rpCh, dcCh, role;
        try {
            await guild.roles.create({
                data: {
                    name: roleName,
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
        newCamp.state = "Finding players";
        embed.fields.find(f => f.name == "Role").value = `<@&${newCamp.role}>`;
        embed.fields.find(f => f.name == "Roleplay Channel").value = `<#${newCamp.roleplayChannel}>`;
        embed.fields.find(f => f.name == "Discuss Channel").value = `<#${newCamp.discussChannel}>`;
        embed.fields.find(f => f.name == "State").value = newCamp.state;
        
        CampModel.create(newCamp);
        //#endregion Creating camp
        
        guild.members.resolve(newCamp.DM).roles.add([role, guild.roles.resolve(tlg.dmRoleID)]);
        rpCh.send(`${role} This is roleplay channel.`);
        dcCh.send(`${role} This is discussion channel.`);

        dmMsgEmbed = client.util.newReturnEmbed(message, await guild.members.resolve(newCamp.DM))
            .setTitle(`Welcome to campaign "${newCamp.name}"!`)
            .setDescription(MessageToDM);
        dcCh.send(`<@!${newCamp.DM}>`, dmMsgEmbed);
        
        embed.setDescription("Campaign creation completed. Here are the initial details of the camp:");
        message.channel.send(embed);
    },
};