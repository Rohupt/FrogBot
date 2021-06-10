const Discord = require('discord.js');
const ServerModel = require('@data/Schema/server-schema.js');
const Config = require('@data/Schema/config-schema.js');

user = (guild, string) => {
    if (!string) return null;
    const matches = string.match(/^<@!?(\d+)>$/);
    if (matches) return guild.members.cache.get(matches[1]);
    if (guild.members.cache.get(string)) return guild.members.cache.get(string);
    if (guild.members.resolve(string)) return guild.members.resolve(string);
    return Array.from(guild.members.cache.values())
        .find(mem => (
            (mem.nickname ? mem.nickname.toLowerCase().includes(string.toLowerCase()) : false) ||
            mem.user.tag.toLowerCase().includes(string.toLowerCase()) ||
            mem.user.username.includes(string.toLowerCase())));
}

channel = (guild, string) => {
    if (!string) return null;
    const matches = string.match(/^<#(\d+)>$/);
    if (matches) return guild.channels.cache.get(matches[1]);
    if (guild.channels.cache.get(string)) return guild.channels.cache.get(string);
    if (guild.channels.resolve(string)) return guild.channels.resolve(string);
    return Array.from(guild.channels.cache.values())
        .find(channel => channel.name.toLowerCase().includes(string.toLowerCase()));
}

role = (guild, string) => {
    if (!string) return null;
    const matches = string.match(/^<@&?(\d+)>$/);
    if (matches) return guild.roles.cache.get(matches[1]);
    if (guild.roles.cache.get(string)) return guild.roles.cache.get(string);
    if (guild.roles.resolve(string)) return guild.roles.resolve(string);
    return Array.from(guild.members.cache.values())
        .find(role => role.name.toLowerCase().includes(string.toLowerCase()));
}

reloadFile = (filepath) => {
    delete require.cache[require.resolve(filepath)];
    return require(filepath);
}

config = async () => {
    return await Config.findById('singleton');
}

setConfig = async (key, value) => {
    await Config.updateOne({ _id: 'singleton'}, { $set: (o = {}, o[key] = value, o) });
}

newReturnEmbed = (message, member) => {
    const isDM = message.channel.type == 'dm';
    const embed = new Discord.MessageEmbed();
    embed.setAuthor(isDM
                ? message.author.username
                : member
                    ? (member.nickname || member.user.username)
                    : (message.member.nickname || message.author.username),
            member ? member.user.avatarURL() : message.author.avatarURL())
        .setColor(isDM ? 'RANDOM' : member ? member.displayHexColor : message.member.displayHexColor);
    return embed;
}

getServerDB = async (id) => {
    return await ServerModel.exists({ _id : id})
        ? await ServerModel.findById(id)
        : await ServerModel.create({ _id : id, prefix: process.env.DEFAULT_PREFIX});
}

commandPrefix = async (client, message) => {
    if (message.channel.type == 'dm') return process.env.DEFAULT_PREFIX;
    if (!client.prefix[message.guild.id])
        client.prefix[message.guild.id] = (await getServerDB(message.guild.id)).prefix;
    return client.prefix[message.guild.id];
}

getCampNames = (camp) => {
    let roleName = (camp.isOS ? "OS " : "") + camp.name;
    let chName = roleName.split(/ +/).join('-').toLowerCase();
    return {roleName, chName};
}

module.exports = {
    user, channel, role,
    reloadFile,
    config,
    setConfig,
    newReturnEmbed,
    getServerDB,
    commandPrefix,
    getCampNames
}