const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['h'];

function channelType(command) {
    switch (command.channelType) {
        case -1: return '`Direct Message only`';
        case 0: return '`Everywhere`';
        case 1: return '`Guild channels only`';
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function replaceAll(str, patterns) {
    patterns.forEach((value, key) => {
        str = str.replace(new RegExp(key, 'g'), value);
    });
    return str;
}

module.exports = {
    name, aliases,
    module: mod,
    channelType: 0, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'everyone',
    userPermissionList: [],
    botPermissionList: [],
    minArguments: 0,
    
    description: 'Display command info and usage.',
    usage: 
        `\`<commandname>\` Display command list\n` +
        `\`<commandname> <command>\` Display command info\n`,

    async execute(client, message, args, joined, embed) {
        let prefix = await client.util.commandPrefix(client, message);
        if (args.length == 0) {
            embed.setTitle('Command list')
                .setDescription(`Here are all the commands of the bot. You can use the prefix \`${prefix}\` or ping the bot to use a command.`);
            client.commands.forEach(command => {
                if (!embed.fields.find(f => f.name === command.module))
                    embed.addField(command.module, '\u200b');
                embed.fields.find(f => f.name === command.module).value += `\`${command.name}\` – ${command.description.split(/\.(?=[ \n\t]|$)/).shift()}.\n`;
            });
            embed.fields.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
        } else {
            const command = client.commands.get(client.calls.get(args[0].toLowerCase()));
            if (command) {
                const ReplaceMap = new Map([
                    ['<commandname>', `${prefix}${command.name}`],
                    ['<pingcommand>', `@${client.user.tag} ${command.name}`]
                ]);
                let displayUsage = command.usage ? replaceAll(command.usage, ReplaceMap) : 'Updating';
                embed.setTitle(`Command: \`${command.name}\``)
                    .setDescription(`${command.description}\n-----------------------------------------------------------------------------------------------`)
                    .addField('Module', `\`${command.module}\``, true)
                    .addField('Channel', channelType(command) , true)
                    .addField('Alias(es)', command.aliases.length == 0 ? 'None' : `\`${command.aliases.join('`, `')}\``, true)
                    .addField('Permission type', command.permission ? `\`${capitalize(command.permission)}\`` : 'None', true)
                    .addField('User permission(s)', command.userPermissionList.length == 0 ? 'None' : `\`${command.userPermissionList.join('`\n `')}\``, true)
                    .addField('Bot permission(s)', command.botPermissionList.length == 0 ? 'None' : `\`${command.botPermissionList.join('`\n `')}\``, true)
                    .addField('Usage', displayUsage);
                if (command.example) {
                    let displayExample = replaceAll(command.example, ReplaceMap);
                    embed.addField('Example', `\`\`\`${displayExample}\`\`\``);
                }
            } else {
                embed.setDescription('There is no such command or alias.');
            }
        }

        message.channel.send(embed);
    },
};