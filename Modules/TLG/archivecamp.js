const Discord = require('discord.js');
const {sep} = require('path');
const {random} = require('mathjs');
const ejf = require('edit-json-file');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name, 'arccamp', 'ac'];

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'moderators',
    
    description: 'Archive a camp\'s roleplay channel as it\'s finished. The role and the discuss channel is deleted.',

    async execute(client, message, args) {
        const pos = {
            archive : function() {
                delete require.cache[require.resolve('../../Data/tlg.json')];
                let tlg = require('../../Data/tlg.json');
                return Array.from(client.guilds.cache.get(tlg.id).channels.cache.values())
                    .filter(ch => (ch.parentID == tlg.archiveCat))
                    .sort((a, b) => {return b.position - a.position})[0]
                    .position;
            },
        };

        const embed = new Discord.MessageEmbed();
        embed.setAuthor(message.member.nickname ? message.member.nickname : message.author.username, message.author.avatarURL())
            .setColor(random([3], 256));

        delete require.cache[require.resolve('../../Data/tlg.json')];
        var {id, archiveCat, campList, noCampRoleID, advLeagueRoleCatID, dmRoleID} = require('../../Data/tlg.json');
        var guild = client.guilds.resolve(id);
        let tlgEdit = ejf('./Data/tlg.json', {
            stringify_width: 4,
            autosave: true
        });
        
        const campName = args.join(' ');
        const camp = campList.filter(c => c.name.toLowerCase().includes(campName.toLowerCase()))[0];
        if (!camp) {
            embed.setDescription('There is no campaign with such name.');
            return message.channel.send(embed);
        };

        var cont = false;
        embed.setDescription(`do you really want to archive the campaign \`${camp.name}\`?\nAnything other than \`Absolutely yes\`will be interpreted as \`no\`.`)
        await message.reply(embed)
            .then(async () => {
                await message.channel.awaitMessages(m => m.author == message.author, {idle : 60000, dispose : true, max : 1, error : ['time']})
                    .then(collected => {
                        if (collected.first().content.toLowerCase().startsWith(`absolutely yes`))
                            cont = true;
                    });
            });
        if (!cont)
            return message.reply("campaign deletion cancelled.");
        
        const newPos = pos.archive() + 1;
        campList.splice(campList.indexOf(camp), 1);
        try {
            await guild.channels.resolve(camp.roleplayChannel).setParent(archiveCat);
            await guild.channels.resolve(camp.discussChannel).delete();
            await guild.roles.resolve(camp.role).delete();
        } catch (error) {
            console.error(error);
            embed.setDescription("...oops, seems like there is an error. Deletion incomplete. Please continue manually.")
            message.reply(embed);
            return message.channel.send(`\`\`\`\n${error}\n\`\`\``);
        }

        guild.channels.resolve(camp.roleplayChannel).setPosition(newPos);
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
        
        message.reply("campaign archived.");
    },
};