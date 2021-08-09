const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['mpi'];

const CampModel = require('@data/Schema/camp-schema.js');

function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
}

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'everyone',
    userPermissionList: [],
    botPermissionList: [],
    minArguments: 2,
    
    description: 'Update the player\'s links to the character sheet and token.',
    usage: `\`<commandname> (<campaign>) (<player>) (-sheet <sheetlink>) (-token <tokenlink>)\`\n\n` +
        "`<campaign>` can be omitted if you use this command in the camp's own channels; and `<player>` can be omitted if you update your own links.",

    async execute(client, message, args, joined, embed) {
        var tlg = client.util.reloadFile('@data/tlg.json');
        
        let {camp, campVar} = await client.util.findCamp(message, args);
        if (!camp)
            return message.channel.send({embeds: [embed.setDescription("Please enter the camp name.")]});
        
        
        if (message.author.id != camp.DM && !camp.players.find(p => p.id == message.author.id) && !message.member.roles.cache.some(r => r.id == tlg.modRoleID) && !message.member.permissions.has('ADMINISTRATOR')) {
            embed.setDescription(`You are not the Dungeon Master or player of this camp (\`${camp.name}\`), nor a moderator.\nYou cannot use this command.`);
            return message.channel.send({embeds: [embed]});
        };
        
        if (camp.players.find(p => p.id == message.author.id)) {
            let tempPlayer = campVar ? client.util.user(message.guild, args[1]) : client.util.user(message.guild, args[0]);
            if (tempPlayer && tempPlayer.id != message.author.id && !message.member.roles.cache.some(r => r.id == tlg.modRoleID) && !message.member.permissions.has('ADMINISTRATOR'))
                return message.channel.send({embeds: [embed.setDescription("You cannot set the links for another player.")]});
            player = message.author.id;
        } else {
            let tempPlayer = campVar ? client.util.user(message.guild, args[1]) : client.util.user(message.guild, args[0]);
            if (!tempPlayer)
                return message.channel.send({embeds: [embed.setDescription("Please specify a player.")]});
            if (!camp.players.find(p => p.id == tempPlayer.id))
                return message.channel.send({embeds: [embed.setDescription("That user is not a player of this camp.")]});
            player = tempPlayer.id;
        }

        const sheet = args.indexOf('-sheet'), token = args.indexOf('-token');
        if ((sheet + token >= 2 && Math.abs(sheet - token) == 1) || (sheet > -1 && sheet + 1 == args.length) || (token > -1 && token + 1 == args.length))
            return message.channel.send({embeds: [embed.setDescription("Please provide enough link(s).")]});

        let campPlayer = camp.players.find(p => p.id == player);
        if (sheet > -1)
            if (validURL(args[sheet + 1]))
                campPlayer.sheet = args[sheet + 1];
            else
                return message.channel.send({embeds: [embed.setDescription("The link is invalid.")]});

        if (token > -1)
            if (validURL(args[token + 1]))
                campPlayer.token = args[token + 1];
            else
                return message.channel.send({embeds: [embed.setDescription("The link is invalid.")]});

        await CampModel.updateOne({ _id : camp.id }, { players: camp.players });
        embed.setTitle(camp.name)
            .setDescription("Completed. Please recheck:")
            .addField("Player", `<@!${player}>`)
            .addField("Sheet link", campPlayer.sheet ? `[[Click here]](${campPlayer.sheet})` : 'None', true)
            .addField("Token link", campPlayer.token ? `[[Click here]](${campPlayer.token})` : 'None', true);
        if (campPlayer.token)
            embed.setImage(campPlayer.token);

        message.channel.send({embeds: [embed]});
    },
};