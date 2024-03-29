const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['pi'];

const CampModel = require('@data/Schema/camp-schema.js');

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'everyone',
    userPermissionList: [],
    botPermissionList: [],
    minArguments: 0,
    
    description: 'View the player\'s links to the character sheet and token.',
    usage: `\`<commandname> (<campaign>) (<player>)\`\n\n` +
        "`<campaign>` can be omitted if you use this command in the camp's own channels; and `<player>` can be omitted if you update your own links.",

    async execute(client, message, args, joined, embed) {
        let {camp, campVar} = await client.util.findCamp(message, args);
        if (!camp)
            return message.channel.send({embeds: [embed.setDescription("Please enter the camp name.")]});
        
        
        let tempPlayer = campVar ? client.util.user(message.guild, args[1]) : client.util.user(message.guild, args[0]);
        if (!tempPlayer)
            return message.channel.send({embeds: [embed.setDescription("Please specify a player.")]});
        if (!camp.players.find(p => p.id == tempPlayer.id))
            return message.channel.send({embeds: [embed.setDescription("That user is not a player of this camp.")]});
        player = tempPlayer.id;

        let campPlayer = camp.players.find(p => p.id == player);
        
        embed.setTitle(camp.name)
            .addField("Player", `<@!${player}>`)
            .addField("Sheet link", campPlayer.sheet ? `[[Click here]](${campPlayer.sheet})` : 'None', true)
            .addField("Token link", campPlayer.token ? `[[Click here]](${campPlayer.token})` : 'None', true);
        if (campPlayer.token)
            embed.setImage(campPlayer.token);

        message.channel.send({embeds: [embed]});
    },
};