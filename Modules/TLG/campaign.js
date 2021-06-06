const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['camp', 'campaigns', 'campinfo'];

const CampModel = require('@data/Schema/camp-schema.js');

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'everyone',
    userPermissionList: [],
    botPermissionList: [],
    minArguments: 0,
    
    description: 'View a list of campaigns, or a particular campaign by name.',
    usage: `\`<commandname>\` View campaigns list\n\n` +
        `\`<commandname> -f running\` View list of running campaigns\n\n` +
        `\`<commandname> -f appliable\` View list of appliable campaigns\n\n` +
        `\`<commandname> <name>\` View a particular campaign\n` +
        'The name should be wrapped in double quotes if it contains a space.',

    async execute(client, message, args, joined, embed) {

        var campList = await CampModel.find({});
        
        if (!args.length) {
            let descr = 'There is no campaigns available';
            if (campList.length){
                descr = "Here are all the campaigns available:\n";
                campList = campList.sort((a, b) => a.isOS == b.isOS ? a.name - b.name : a.isOS ? -1 : 1);
                let i = 0;
                campList.forEach(camp => {
                    descr += `${++i}. \`${camp.isOS ? '(OS) ' : ''}${camp.name}\`\n`;
                });
            }
            embed.setDescription(descr);
            return message.channel.send(embed);
        };

        if (args[0] == '-f') {
            let descr = '';
            campList.sort((a, b) => a.isOS == b.isOS ? a.name - b.name : a.isOS ? -1 : 1);
            let i = 0;
            switch (args[1].toLowerCase()) {
                case 'running':
                    if (!campList.length) {
                        descr = "There is no camp running."; break;
                    }
                    descr = "Here are all the campaign currently running:\n";
                    campList.forEach(camp => {
                        if (camp.state == 'Running')
                            descr += `${++i}. \`${camp.isOS ? '(OS) ' : ''}${camp.name}\`\n`;
                    });
                    break;
                case 'appliable':
                    if (!campList.length) {
                        descr = "There is no camp available."; break;
                    }
                    descr = "Here are all the campaigns available for applying:\n";
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
        
        const campName = joined;
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