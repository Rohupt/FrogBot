const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['dr'];

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'administrators',
    userPermissionList: [],
    botPermissionList: [],
    minArguments: 0,
    
    description: 'Display the rules and FAQs of the server.',
    usage: `\`<commandname>\``,

    async execute(client, message, args, joined, embed) {
        const rulesAndFAQs = client.util.reloadFile('@data/rules.json');

        const ruleEmbed = new Discord.MessageEmbed()
            .setColor('#57f287').setTitle('NỘI QUY THẦN LONG GIÁO').setDescription(rulesAndFAQs.rules.description + "\n\u200b")
            .setFooter("Thần Long Giáo - Cộng đồng D&D Việt Nam trên Discord", message.guild.iconURL());
        const faqEmbed = new Discord.MessageEmbed().setColor('#57f287').setTitle('FAQ - CÂU HỎI THƯỜNG GẶP')
            .setFooter("Thần Long Giáo - Cộng đồng D&D Việt Nam trên Discord", message.guild.iconURL());
        const formsEmbed = new Discord.MessageEmbed().setColor('#57f287')
            .setFooter("Thần Long Giáo - Cộng đồng D&D Việt Nam trên Discord", message.guild.iconURL())
            .setDescription("Bạn có thể đóng góp câu hỏi để bổ sung vào mục FAQ bên trên tại đây: https://forms.gle/Wa61s9yPs8DZrG6L9\n\n" +
                "Đánh giá chất lượng Tiếp tân: https://forms.gle/oxR2P9iCKJUUE9Hi6");

        rulesAndFAQs.rules.rules.forEach(rule => ruleEmbed.addField(rule.name, rule.text + "\n\u200b"));
        rulesAndFAQs.faqs.forEach(q => faqEmbed.addField(q.name, q.text+ "\n\u200b"));

        await message.channel.send(ruleEmbed);
        await message.channel.send(faqEmbed);
        await message.channel.send(formsEmbed);
        await message.delete();
    },
};