const Discord = require('discord.js');
const {sep} = require('path');
const {random} = require('mathjs');
const ejf = require('edit-json-file');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name, 'delcamp', 'delc', 'dc'];

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'moderators',
    
    description: 'Delete a camp as well as its channels and role.',

    async execute(client, message, args) {
        const embed = new Discord.MessageEmbed();
        embed.setAuthor(message.member.nickname ? message.member.nickname : message.author.username, message.author.avatarURL())
            .setColor(random([3], 256));

        delete require.cache[require.resolve('../../Data/tlg.json')];
        var {id, campList} = require('../../Data/tlg.json');
        const guild = client.guilds.resolve(id);
        let tlgEdit = ejf('./Data/tlg.json', {
            stringify_width: 4,
            autosave: true
        });
        
        const campName = args.join(' ');
        const camp = campList.find(c => c.name.toLowerCase().includes(campName.toLowerCase()));
        if (!camp) {
            embed.setDescription('There is no campaign with such name.');
            return message.channel.send(embed);
        };

        var cont = false;
        await message.reply(`do you really want to delete the campaign \`${camp.name}\`?\nAnything other than \`Absolutely yes\`will be interpreted as \`no\`.`)
            .then(async () => {
                await message.channel.awaitMessages(m => m.author == message.author, {idle : 60000, dispose : true, max : 1, error : ['time']})
                    .then(collected => {
                        if (collected.first().content.toLowerCase().startsWith(`absolutely yes`))
                            cont = true;
                    });
            });
        if (!cont)
            return message.reply("campaign deletion cancelled.");
        
        try {
            await guild.roles.resolve(camp.role).delete();
            await guild.channels.resolve(camp.discussChannel).delete();
            await guild.channels.resolve(camp.roleplayChannel).delete();
        } catch (error) {
            console.error(error);
            message.reply("...oops, seems like there is an error. Deletion incomplete. Please continue manually.");
            message.channel.send(`\`\`\`\n${error}\n\`\`\``);
        }
        
        campList.splice(campList.indexOf(camp), 1);
        tlgEdit.set("campList", campList);
        const campRoleMaxPos = guild.roles.resolve(noCampRoleID).position,
            campRoleMinPos = guild.roles.resolve(advLeagueRoleCatID).position;
        if (!campList.filter(c => c.DM == camp.DM).length)
            guild.members.resolve(camp.DM).roles.remove(dmRoleID);
        if (!guild.members.resolve(camp.DM).roles.cache.some(r => (r.position > campRoleMinPos && r.position < campRoleMaxPos)))
            guild.members.resolve(camp.DM).roles.add(noCampRoleID);
        camp.players.forEach(p => {
            let player = guild.members.resolve(p);
            if (!player.roles.cache.some(r => (r.position > campRoleMinPos && r.position < campRoleMaxPos)))
                player.roles.add(noCampRoleID);
        });
        message.reply("campaign deleted.");
    },
};