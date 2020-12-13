const Discord = require('discord.js');
const math = require('mathjs');
const ejf = require('edit-json-file');

module.exports = {
    userFM(message, mention) {
        const matches = mention.match(/^<@!?(\d+)>$/);
        if (!matches) return;
        return message.guild.members.cache.get(matches[1]);
    },

    channelFM(message, mention) {
        const matches = mention.match(/^<#(?<id>\d+)>$/);
        if (!matches) return;
        return message.guild.channels.cache.get(matches[1]);
    },

    roleFM(message, mention) {
        const matches = mention.match(/^<@&(\d+)>$/);
        if (!matches) return;
        return message.guild.roles.cache.get(matches[1]);
    },

    user(message, string) {
        const matches = string.match(/^<@!?(\d+)>$/);
        if (matches) return message.guild.members.cache.get(matches[1]);
        if (message.guild.members.cache.get(string)) return message.guild.members.cache.get(string);
        return Array.from(message.guild.members.cache.values())
            .find(mem => (
                (mem.nickname ? mem.nickname.toLowerCase().includes(string.toLowerCase()) : false) ||
                mem.user.tag.toLowerCase().includes(string.toLowerCase()) ||
                mem.user.username.includes(string.toLowerCase())));
    }
}