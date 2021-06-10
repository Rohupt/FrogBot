const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['buc'];

const fetchAll = require('discord-fetch-all');
const ExcelJS = require('exceljs');
const FS = require('fs');
const OS = require('os');

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'moderator',
    userPermissionList: [],
    botPermissionList: [],
    minArguments: 1,
    
    description: "Back up a channel's chat history",
    usage: `\`<commandname> <channel>\``,

    async execute(client, message, args, joined, embed) {
        let guild, channel;
        try {
            channel = await client.util.channel(message.guild, args[0]);
        } catch (error) {
            return message.channel.send(embed.setDescription('Cannot access the channel.'));
        }
        if (!channel) return message.channel.send(embed.setDescription('Cannot access the channel.'));
        
        let messages = await fetchAll.messages(channel, {
            reverseArray: true, userOnly: false, botOnly: false, pinnedOnly: false
        });
        messages = messages.filter(msg => !msg.system).map(msg => {
            return {
                author: {name: msg.author.username, avatarURL: msg.author.displayAvatarURL()},
                content: msg.content,
                embeds: msg.embeds.map(em => {
                    return {
                        title: em.title, description: em.description,
                        url: em.url, author: em.author, image: em.image,
                        fields: em.fields
                    }
                }),
                attachments: msg.attachments.map(a => {
                    return { attachment: a.attachment, name: a.name, url: a.url, proxyURL: a.proxyURL }
                }),
            }
        })
        
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'FrogBot#0468';
        workbook.created = new Date();
        workbook.views = [{
            x: 0, y: 0, width: 10000, height: 20000,
            firstSheet: 0, activeTab: 1, visibility: 'visible'
        }];

        const sheet = workbook.addWorksheet('Messages');

        sheet.columns = [
            { header: 'AUTHOR', key: 'author', width: 20 },
            { header: 'CONTENT', key: 'content', width: 80 },
            { header: 'ATTACHMENTS', key: 'attachments', width: 40 },
            { header: 'EMBEDS', key: 'embeds', width: 40},
        ]

        for (let i = 0; i < messages.length; i++) {
            let message = messages[i];
            let embeds = '', attachments = '';
            if (message.embeds.length)
                embeds = JSON.stringify(message.embeds, null, 4);
            if (message.attachments.length)
                attachments = message.attachments.map(a => a.attachment).join('\n');
            sheet.addRow({author: message.author.name, content: message.content.replace(new RegExp('\\n', 'g'), '\n'), embeds: embeds, attachments: attachments});

        };
        const path = (OS.platform() == 'linux' ? '/app/' : '') + `Data/Archives/${channel.name}.xlsx`;
        await workbook.xlsx.writeFile(path);

        await message.channel.send([embed.setDescription('Archive completed.'), new Discord.MessageAttachment(path)]);
        FS.unlink(path, err => {if (err) console.error(err)});
    },
};