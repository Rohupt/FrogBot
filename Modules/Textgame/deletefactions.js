const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['df'];

module.exports = {
    name, aliases,
    module: mod,
    channelType: 0, //-1: direct message only, 0: both, 1: guild channel only
    permission: '',
    userPermissionList: ['moderators'],
    botPermissionList: ['MANAGE_CHANNELS', 'MANAGE_ROLES', 'SEND_MESSAGES'],
    minArguments: 1,
    
    description: '',
    usage: `\`<commandname> <id-list>\`: Delete channels and roles by their id. Category's children will also be deleted.`,

    async execute(client, message, args, joined, embed) {
        args.forEach(async arg => {
            let object;
            if (object = client.util.channel(message.guild, arg)) {
                if (object.type = 'GUILD_CATEGORY') {
                    await object.children.forEach(child => {child.delete();});
                }
                await object.delete();
            }
            if (object = client.util.role(message.guild, arg)) {
                await object.delete();
            }
        });

        return message.reply('Done');
    },
};