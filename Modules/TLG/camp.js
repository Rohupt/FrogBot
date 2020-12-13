const Discord = require('discord.js');
const {sep} = require('path');
const {random} = require('mathjs');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name, 'campaign', 'campinfo', 'campaigninfo'];

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'everyone',
    
    description: 'Show informations of a campaign in the server',

    execute(client, message, args) {
        const embed = new Discord.MessageEmbed();
        embed.setAuthor(message.member.nickname ? message.member.nickname : message.author.username, message.author.avatarURL())
        .setColor(random([3], 256));

        delete require.cache[require.resolve('../../Data/tlg.json')];
        var {campList} = require('../../Data/tlg.json');
        
        if (!args.length) {
            let descr = "Here are all the campaigns available:\n";
            campList = campList.sort((a, b) => a.isOS == b.isOS ? a.name - b.name : a.isOS ? -1 : 1);
            let i = 0;
            campList.forEach(camp => {
                descr += `${++i}. \`${camp.isOS ? '(OS) ' : ''}${camp.name}\`\n`;
            });
            embed.setDescription(descr);
            return message.channel.send(embed);
        };

        if (args[0] == '-f') {
            let descr = '';
            campList = campList.sort((a, b) => a.isOS == b.isOS ? a.name - b.name : a.isOS ? -1 : 1);
            let i = 0;
            switch (args[1].toLowerCase()) {
                case 'running':
                    descr = "Here are all the campaigns currently running:\n";
                    campList.forEach(camp => {
                        if (camp.state == 'Running')
                            descr += `${++i}. \`${camp.isOS ? '(OS) ' : ''}${camp.name}\`\n`;
                    });
                    break;
                case 'appliable':
                    descr = "Here are all the campaigns available for apply:\n";
                    campList.forEach(camp => {
                        if (camp.state == 'Finding players')
                            descr += `${++i}. \`${camp.isOS ? '(OS) ' : ''}${camp.name}\`\n`;
                    });
                    break;
                default:
                    descr = 'Wrong argument provided.';
                    break;
            };
            embed.setDescription(descr);
            return message.channel.send(embed);
        };
        
        const campName = args.join(' ');
        const camp = campList.find(c => c.name.toLowerCase().includes(campName.toLowerCase()));
        if (!camp) {
            embed.setDescription('There is no campaign with such name.');
            return message.channel.send(embed);
        };
        var players = '|';
        camp.players.forEach(p => players += ` ${message.guild.members.resolve(p)} |`);
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
        message.channel.send(embed);
    },
};