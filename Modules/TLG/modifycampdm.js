const Discord = require('discord.js');
const {random} = require('mathjs');
const {sep} = require('path');
const ejf = require('edit-json-file');

const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name, 'mcdm'];

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'moderators',
    
    description: 'Modify the dungeon master of a campaign.',

    async execute(client, message, args) {
        const embed = new Discord.MessageEmbed();
        const user = client.util.user;
        embed.setAuthor(message.member.nickname ? message.member.nickname : message.author.username, message.author.avatarURL())
            .setColor(random([3], 256));

        delete require.cache[require.resolve('../../Data/tlg.json')];
        var tlg = require('../../Data/tlg.json');
        let tlgEdit = ejf('./Data/tlg.json', {
            stringify_width: 4,
            autosave: true
        });
        const guild = client.guilds.resolve(tlg.id);
        
        const camp = tlg.campList.find(c => c.name.toLowerCase().includes(args[0].toLowerCase()));
        if (!camp) {
            embed.setDescription(`There is no campaign named \`${args[0]}\`.`);
            return message.channel.send(embed);
        };
        const campIndex = tlg.campList.indexOf(camp);

        const newDM = guild.members.resolve(user(message, args[1]));
        if (!newDM) {
            embed.setDescription("Please provide a new DM's identity.");
            return message.channel.send(embed);
        };
        const oldDM = guild.members.resolve(camp.DM);
        if (newDM === oldDM) {
            embed.setDescription("The old DM and the new one are the same person, hence no change made.");
            return message.channel.send(embed);
        };

        const rpCh = guild.channels.resolve(camp.roleplayChannel), dcCh = guild.channels.resolve(camp.discussChannel);
        camp.DM = newDM.id;
        rpCh.permissionOverwrites.get(oldDM.id).delete();
        dcCh.permissionOverwrites.get(oldDM.id).delete();
        if (!camp.players.some(p => p == oldDM.id))
            oldDM.roles.remove(camp.role);
        if (!tlg.campList.filter(c => c.DM == oldDM.id).length)
            oldDM.roles.remove(tlg.dmRoleID);
        
        newDM.roles.add([camp.role, tlg.dmRoleID]);
        rpCh.updateOverwrite(newDM, {'SEND_MESSAGES': true, 'MANAGE_MESSAGES': true});
        dcCh.updateOverwrite(newDM, {'SEND_MESSAGES': true, 'MANAGE_MESSAGES': true});
        
        tlgEdit.set(`campList.${campIndex}.DM`, newDM.id);
        embed.setTitle(camp.name).setDescription("Dungeon Master changed sucessfully:")
            .addField('Old DM', oldDM, true).addField('New DM', newDM, true);
        message.channel.send(embed);
    },
};