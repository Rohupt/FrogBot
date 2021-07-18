const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['ac'];

const ejf = require('edit-json-file');

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'administrators',
    userPermissionList: [],
    botPermissionList: [],
    minArguments: 0,
    
    description: 'View or change the archive category.',
    usage: `\`<commandname>\`: View the archive category.\n` +
        `\`<commandname> <categoryID>\`: Change the archive category.`,

    async execute(client, message, args, joined, embed) {
        let tlg = client.util.reloadFile('@data/tlg.json');
        let tlgEdit = ejf('Data/tlg.json');

        if (args.length == 0) {
            return message.channel.send(
                embed.setDescription(`Current archive category is **<#${tlg.archiveCat}>**.`)
            );
        } else {
            let newAC = client.util.channel(message.guild, args[0]);
            if (!newAC || newAC.type != 'category')
                return message.channel.send(
                    embed.setDescription('Invalid category. Please provide an ID of a **Category** channel within **this server**.')
                );
            if (newAC.children.size >= client.constants.MAX_CHANNELS_PER_CATEGORY)
                return message.channel.send(
                    embed.setDescription('Category already full. Please choose another category.')
                );
            tlgEdit.set("archiveCat", newAC.id);
            tlgEdit.save();
            return await message.channel.send(
                embed.setDescription(`Archive category changed to **<#${newAC.id}>**.`)
            );
        }
    },
};