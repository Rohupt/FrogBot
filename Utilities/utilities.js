const Discord = require('discord.js');
const ServerModel = require('@data/Schema/server-schema.js');

userFM = (message, mention) => {
    const matches = mention.match(/^<@!?(\d+)>$/);
        if (!matches) return;
        return message.guild.members.cache.get(matches[1]);
}

channelFM = (message, mention) => {
    const matches = mention.match(/^<#(?<id>\d+)>$/);
    if (!matches) return;
    return message.guild.channels.cache.get(matches[1]);
}

roleFM = (message, mention) => {
    const matches = mention.match(/^<@&(\d+)>$/);
    if (!matches) return;
    return message.guild.roles.cache.get(matches[1]);
}

user = (message, string) => {
    const matches = string.match(/^<@!?(\d+)>$/);
    if (matches) return message.guild.members.cache.get(matches[1]);
    if (message.guild.members.cache.get(string)) return message.guild.members.cache.get(string);
    if (message.guild.members.resolve(string)) return message.guild.members.resolve(string);
    return Array.from(message.guild.members.cache.values())
        .find(mem => (
            (mem.nickname ? mem.nickname.toLowerCase().includes(string.toLowerCase()) : false) ||
            mem.user.tag.toLowerCase().includes(string.toLowerCase()) ||
            mem.user.username.includes(string.toLowerCase())));
}

channel = (message, string) => {
    const matches = string.match(/^<#(\d+)>$/);
    if (matches) return message.guild.channels.cache.get(matches[1]);
    if (message.guild.channels.cache.get(string)) return message.guild.channels.cache.get(string);
    if (message.guild.channels.resolve(string)) return message.guild.channels.resolve(string);
    return Array.from(message.guild.channels.cache.values())
        .find(channel => channel.name.toLowerCase().includes(string.toLowerCase()));
}

role = (message, string) => {
    const matches = string.match(/^<@&?(\d+)>$/);
    if (matches) return message.guild.roles.cache.get(matches[1]);
    if (message.guild.roles.cache.get(string)) return message.guild.roles.cache.get(string);
    if (message.guild.roles.resolve(string)) return message.guild.roles.resolve(string);
    return Array.from(message.guild.members.cache.values())
        .find(role => role.name.toLowerCase().includes(string.toLowerCase()));
}

reloadFile = (filepath) => {
    delete require.cache[require.resolve(filepath)];
    return require(filepath);
}

newReturnEmbed = (message) => {
    const isDM = message.channel.type == 'dm';
    const embed = new Discord.MessageEmbed();
    embed.setAuthor(isDM ? message.author.username : (message.member.nickname || message.author.username), message.author.avatarURL())
        .setColor(isDM ? 'RANDOM' : message.member.displayHexColor);
    return embed;
}

getServerDB = async (client, id) => {
    return await ServerModel.exists({ _id : id})
        ? await ServerModel.findById(id)
        : await ServerModel.create({ _id : id, prefix: client.prefix.default});
}

commandPrefix = async (client, message) => {
    if (message.channel.type == 'dm') return client.prefix.default;
    if (!client.prefix[message.guild.id])
        client.prefix[message.guild.id] = (await getServerDB(client, message.guild.id)).prefix;
    return client.prefix[message.guild.id];
}

getCampNames = (camp) => {
    let roleName = (camp.isOS ? "OS " : "") + camp.name;
    let chName = roleName.split(/ +/).join('-').toLowerCase();
    return {roleName, chName};
}

module.exports = {
    userFM, channelFM, roleFM,
    user, channel, role,
    reloadFile,
    newReturnEmbed,
    getServerDB,
    commandPrefix,
    getCampNames
}