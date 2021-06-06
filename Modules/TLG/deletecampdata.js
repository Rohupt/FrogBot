const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['delcampdata', 'dcd'];

const CampModel = require('@data/Schema/camp-schema.js');

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'moderators',
    userPermissionList: [],
    botPermissionList: [],
    minArguments: 0,
    
    description: 'Delete a camp from database. It doesn\'t affect the channels and role.' ,
    usage: `\`<commandname> <name>\` Delete a campaign named <name>\n` +
        'The name should be wrapped in double quotes if it contains a space.',

    async execute(client, message, args, joined, embed) {
        var tlg = client.util.reloadFile('@data/tlg.json');
        var campList = await CampModel.find({});
        
        const campName = joined;
        const camp = campList.find(c => c.name.toLowerCase().includes(campName.toLowerCase()));
        if (!camp) {
            embed.setDescription('There is no campaign with such name.');
            return message.channel.send(embed);
        };

        await CampModel.deleteOne({ _id: camp.id });
        message.reply(embed.setDescription("Campaign deleted."));
    },
};