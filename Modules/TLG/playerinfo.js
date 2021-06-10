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
    
    description: 'View the camp player\'s link to the character sheet and token',
    usage: `\`<commandname> (<campaign>) (<player>)\`\n\n` +
        "`<campaign>` can be omitted if you use this command in the camp's own channels; and `<player>` can be omitted if you update your own links.",

    async execute(client, message, args, joined, embed) {
        var tlg = client.util.reloadFile('@data/tlg.json');
        var campList = await CampModel.find({});

        let camp = null, player = null, campVar = true;
        if (args[0])
            camp = campList.find(c => c.name.toLowerCase().includes(args[0].toLowerCase()));
        if (!camp) {
            camp = campList.find(c => (c.discussChannel == message.channel.id || c.roleplayChannel == message.channel.id));
            campVar = false;
        }
        if (!camp)
            return message.channel.send(embed.setDescription("Please enter the camp name."));

        if (message.author.id != camp.DM && !camp.players.find(p => p.id == message.author.id) && !message.member.roles.cache.some(r => r.id == tlg.modRoleID) && !message.member.hasPermission('ADMINISTRATOR')) {
            return message.channel.send(embed.setDescription("You are not the Dungeon Master or a player of this camp, nor a moderator.\nYou cannot use this command."));
        };

        if (camp.players.find(p => p.id == message.author.id)) {
            let tempPlayer = campVar ? client.util.user(message.guild, args[1]) : client.util.user(message.guild, args[0]);
            if (tempPlayer && tempPlayer.id != message.author.id && !message.member.roles.cache.some(r => r.id == tlg.modRoleID) && !message.member.hasPermission('ADMINISTRATOR'))
                return message.channel.send(embed.setDescription("You cannot set the links for another player."));
            player = message.author.id;
        } else {
            let tempPlayer = campVar ? client.util.user(message.guild, args[1]) : client.util.user(message.guild, args[0]);
            if (!tempPlayer)
                return message.channel.send(embed.setDescription("Please specify a player."));
            if (!camp.players.find(p => p.id == tempPlayer.id))
                return message.channel.send(embed.setDescription("That user is not a player of this camp."));
            player = tempPlayer.id;
        }

        let campPlayer = camp.players.find(p => p.id == player);
        
        embed.setTitle(camp.name)
            .addField("Player", `<@!${player}>`)
            .addField("Sheet link", campPlayer.sheet ? `[[Click here]](${campPlayer.sheet})` : 'None', true)
            .addField("Token link", campPlayer.token ? `[[Click here]](${campPlayer.token})` : 'None', true);
        if (campPlayer.token)
            embed.setImage(campPlayer.token);

        message.channel.send(embed);
    },
};