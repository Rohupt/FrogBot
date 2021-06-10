const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = ['buc'];

const fetchAll = require('discord-fetch-all');

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: '',
    userPermissionList: [],
    botPermissionList: [],
    minArguments: 2,
    
    description: '',
    usage: `\`<commandname>\``,

    async execute(client, message, args, joined, embed) {
        let guild, channel;
        try {
            channel = await client.util.channel(message.guild, args[0]);
        } catch (error) {
            return message.channel.send(embed.setDescription('Cannot access the channel.'));
        }
        if (!channel) return message.channel.send(embed.setDescription('Cannot access the channel.'));
        
        try {
            guild = await client.guilds.fetch(args[1]);
        } catch (error) {
            return message.channel.send(embed.setDescription('Cannot access the guild.'));
        }
        if (!guild) return message.channel.send(embed.setDescription('Cannot access the guild.'));
        
        let newChannel = await guild.channels.create(channel.name, {
            topic: channel.topic, nsfw: channel.nsfw,
        });

        let webhooks = new Discord.Collection();
        let messages = await fetchAll.messages(channel, {
            reverseArray: false, userOnly: false, botOnly: false, pinnedOnly: false
        });
        messages.forEach(async msg => {
            console.log(webhooks);
            let wh;
            if (webhooks.has(msg.author.id)) {
                wh = webhooks.get(msg.author.id)
                console.log(wh);
            }
            else {
                wh = await newChannel.createWebhook(
                    msg.member.nickname
                        ? msg.member.nickname : msg.author.username,
                    {avatar: msg.author.displayAvatarURL()});
                console.log(wh);
                webhooks.set(msg.author.id, wh);
            } 
            await wh.send(msg.content, [...msg.attachments.values(), ...msg.embeds])
                .then(m => console.log(wh.id, wh.name));
        });
        webhooks.forEach(async wh => {await wh.delete()});
        message.channel.send(embed.setDescription(`Back up finished. [Click here](https://discord.com/channels/${newChannel.guild.id}/${newChannel.id}) to go to the channel.`));
    },
};