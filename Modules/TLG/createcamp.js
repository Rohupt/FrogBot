const Discord = require('discord.js');
const {random} = require('mathjs');
const {sep} = require('path');
const ejf = require('edit-json-file');

const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name, 'cc'];
const exitMsg = "\nYou can always type `exit` or `cancel` to cancel this process."
const timeoutMsg = "you didn't response for some time. Camp creation cancelled."
const cancelMsg = "Camp creation cancelled."

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'moderators',
    
    description: 'Create a new camp',

    async execute(client, message, args) {
        const user = client.util.user;
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
        
        const filter = m => m.author == message.author;
        const idle = 120000;
        const guild = client.guilds.resolve(tlg.id);
        const embed = new Discord.MessageEmbed();
        embed.setAuthor(message.member.nickname ? message.member.nickname : message.author.username, message.author.avatarURL())
            .setColor(random([3], 256));
        embed.setTitle("New camp creation")
            .addField("Type", `None`, true)
            .addField("State", "Creating", true)
            .addField("DM", `Not set yet`, true)
            .addField("Roleplay Channel", `None`, true)
            .addField("Discuss Channel", `None`, true)
            .addField("Role", `None`, true)
            .addField("Players", "No one yet");
        
        var exit = false;

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
        
        //#region Camp's name
        var description = "What is the camp's name?";
        var warning = "";
        embed.setDescription(warning + '**' + description + '**' + exitMsg);
        await message.channel.send(embed).then(async () => {
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
        if (exit) return;
        //#endregion Camp's name

        //#region Type
        description = "Is it an ONESHOT? Anything other than `yes` or `y` will be understood as `no` (i.e. it's a long camp)."
        warning = "";
        embed.setDescription(warning + '**' + description + '**' + exitMsg);
        await message.channel.send(embed).then(async () => {
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
        if (exit) return;
        embed.fields.find(f => f.name == "Type").value = `${newCamp.isOS ? "Oneshot" : "Full"}`;
        //#endregion Type
        
        //#region Dungeon Master
        description = "Who is the Dungeon Master?"
        do {
            embed.setDescription(warning + '**' + description + '**' + exitMsg);
            warning = "Your input was not valid.\n";
            await message.channel.send(embed).then(async () => {
                await message.channel.awaitMessages(filter, {idle : idle, dispose : true, max : 1, error : ['time']})
                    .then(collected => {
                        const content = collected.first().content;
                        if (content != 'exit' && content != 'cancel') {
                            let DM = guild.members.resolve(user(collected.first(), collected.first().content))
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
        if (exit) return;
        embed.fields.find(f => f.name == "DM").value = `${guild.members.resolve(newCamp.DM)}`;
        //#endregion Dungeon Master

        //#region Description
        description = "Please provide some description for the camp, or `next`/`none` if there is no description."
        warning = "";
        embed.setDescription(warning + '**' + description + '**' + exitMsg);
        await message.channel.send(embed).then(async () => {
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
        if (exit) return;
        if (newCamp.description) embed.addField("Description", newCamp.description);
        //#endregion Description

        //#region Notes
        description = "Notes for player candidates, or `next`/`none` if there is no note. May include:\n"
            + "- Level bound\n- Playing schedule\n- Number of player slots\n- Restrictions\netc.";
        warning = "";
        embed.setDescription(warning + '**' + description + '**' + exitMsg);
        await message.channel.send(embed).then(async () => {
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
        
        //#region Creating camp
        var roleName = newCamp.name;
        var rpChPos, dcChPos, rolePos;
        if (newCamp.isOS) {
            rpChPos = pos.osRpChannel() + 1;
            dcChPos = pos.osDiscChannel() + 1;
            rolePos = pos.osRole();
            roleName = "OS " + roleName;
        } else {
            rpChPos = pos.fullRpChannel() + 1;
            dcChPos = pos.fullDiscChannel() + 1;
            rolePos = pos.fullRole();
        };
        const chName = roleName.split(/ +/).join('-').toLowerCase();

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
        
        tlg.campList.push(newCamp);
        tlgEdit.set("campList", tlg.campList);
        //#endregion Creating camp
        
        guild.members.resolve(newCamp.DM).roles.add([role, guild.roles.resolve(tlg.dmRoleID)]);
        rpCh.send(`${role} Đây là kênh roleplay.`);
        dcCh.send(`${role} Đây là kênh thảo luận.`);
        
        embed.setDescription("Campaign creation completed. Here are the initial details of the camp:");
        message.channel.send(embed);
    },
};