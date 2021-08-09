const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['devm', 'dm', 'devmode'];

module.exports = {
    name, aliases,
    module: mod,
    channelType: 0, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'developer',
    userPermissionList: [],
    botPermissionList: [],
    minArguments: 0,
    
    description: 'Set the Developer Mode of the bot. If it\'s \`ON\`, people other than the bot developer cannot use any command.',
    usage: `\`<commandname>\` Show Developer Mode status.\n\n` +
        `\`<commandname> ON\` Turn Developer Mode on.\n` +
        '\tCorresponding options: `enable, ENABLE, true, TRUE, on, ON, t, T, 1, +`\n\n' +
        `\`<commandname> OFF\` Turn Developer Mode off.\n` +
        '\tCorresponding options: `disable, DISABLE, false, FALSE, off, OFF, f, F, 0, -`\n\n' +
        `\`<commandname> REVERSE\` Switch Developer Mode on/off.\n` +
        '\tCorresponding options: `reverse, REVERSE, r, R, -1, /`',

    async execute(client, message, args, joined, embed) {
        if (!args.length) {
            embed.setDescription(`Developer Mode is currently \`${client.developerMode ? 'ON' : 'OFF'}\`.`);
        } else {
            var state;
            if (['enable', 'ENABLE', 'true', 'TRUE', 'on', 'ON', 't', 'T', '1', '+'].includes(args[0]))
                state = true;
            else if (['disable', 'DISABLE', 'false', 'FALSE', 'off', 'OFF', 'f', 'F', '0', '-'].includes(args[0]))
                state = false;
            else if (['reverse', 'REVERSE', 'r', 'R', '-1', '/'].includes(args[0]))
                state = !client.developerMode;
            else
                return message.reply({embeds: [embed.setDescription("That's not the expected input.")]});
            
            client.developerMode = state;
            await client.util.setConfig('developerMode', state);
            embed.setDescription(`Developer Mode is now \`${state ? 'ON' : 'OFF'}\`.`)
            client.user.setActivity(`${state ? 'the dev only' : 'everyone'}`, {type: 'LISTENING'});
        };
        message.channel.send({embeds: [embed]});
    },
};