const Discord = require('discord.js');
const {random} = require('mathjs');
const {sep} = require('path');
const ejf = require('edit-json-file');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name, 'devm'];

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'developer',
    
    description: 'Set the Developer Mode of the bot. If it\'s \`true\`, people other than the bot developer cannot use any command.',

    execute(client, message, args) {
        delete require.cache[require.resolve('../../Data/config.json')];
        let config = require('../../Data/config.json');
        let configejf = ejf('./Data/config.json', {
            stringify_width: 4,
            autosave: true
        });
        const embed = new Discord.MessageEmbed();
        embed.setAuthor(message.member.nickname ? message.member.nickname : message.author.username, message.author.avatarURL())
            .setColor(random([3], 256));

        if (!args.length) {
            embed.setDescription(`Developer Mode is currently \`${config.developerMode ? 'ON' : 'OFF'}\`.`);
        } else {
            var state;
            if (['true', 'TRUE', 'on', 'ON', 't', 'T', '1', '+'].includes(args[0]))
                state = true;
            else if (['false', 'FALSE', 'off', 'OFF', 'f', 'F', '0', '-'].includes(args[0]))
                state = false;
            else if (['reverse', 'REVERSE', 'r', 'R', '-1', '/'].includes(args[0]))
                state = !config.developerMode;
            else {
                message.reply("that's not the expected input.");
                return;
            };
            embed.setDescription(`Developer Mode is now \`${state ? 'ON' : 'OFF'}\`.`)
            configejf.set(`developerMode`, state);
            client.user.setActivity(`${state ? 'the dev only' : 'everyone'}`, {type: 'LISTENING'});
        };
        message.channel.send(embed);
    },
};