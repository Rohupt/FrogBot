const {pickRandom} = require('mathjs');
const replies = require('../Data/replies.json');
const tlg = require('../Data/tlg.json');

function getArgs(message) {
    var doubleDoubleQuote = '<DDQ>';
    while (message.indexOf(doubleDoubleQuote) > -1) doubleDoubleQuote += '@';
    var spaceMarker = '<SP>';
    while (message.indexOf(spaceMarker) > -1) spaceMarker += '@';
    var newLineMarker = '<NL>';
    while (message.indexOf(newLineMarker) > -1) newLineMarker += '@';
    var tabMarker = '<T>';
    while (message.indexOf(tabMarker) > -1) tabMarker += '@';

    return message.replace( /""/g, doubleDoubleQuote)
        .replace(/"([^"]*)"?/g, (fullMatch, capture) => {
            return capture.replace(/ /g, spaceMarker).replace(/\t/g, tabMarker).replace(/\n/g, newLineMarker).replace(RegExp(doubleDoubleQuote, 'g'), '"');
        }).trim().split(/[ \n\t]+/).map((mangledParam) => {
            return mangledParam.replace(RegExp(spaceMarker, 'g'), ' ').replace(RegExp(tabMarker, 'g'), '\t').replace(RegExp(newLineMarker, 'g'), '\n').replace(RegExp(doubleDoubleQuote, 'g'), '');
        });
};

module.exports = (client, message) => {
    var prefix = client.prefix[message.guild.id];
    
    if (message.author.bot) return;
    if (message.content.startsWith(prefix + ' ')) return;
    if (!message.content.startsWith(prefix) && !message.content.startsWith(`<@!${client.user.id}>`)) return;
    
    //#region Check command name
    const prefixLength = message.content.startsWith(prefix) ? prefix.length : `<@!${client.user.id}>`.length;
    const args = getArgs(message.content.slice(prefixLength));
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(client.aliases.get(commandName));
    //return console.log(client.commands); //Debugging line
    if (!command) return;
    if (command.module == 'TLG' && message.guild.id != tlg.id)
        return message.reply("that command is not for this server.");
    console.log(`\n\nCommand received: ${command.name}\n`
        + `Guild\t\t: ${message.guild.name}\n`
        + `Channel\t\t: ${message.channel.name}\n`
        + `Caller\t\t: ${message.author.tag}\n`
        + `Arguments\t: [${args.join(', ')}]`);
    //#endregion Check command name

    //#region Check developer mode
    delete require.cache[require.resolve('../Data/config.json')];
    let config = require('../Data/config.json');
    if (config.developerMode && message.author.id != config.ownerID) {
        message.reply(pickRandom(replies.developerMode));
        return;
    }
    //#endregion Check developer mode
    
    //#region Check caller's permissions
    let permission = false;
    switch (command.permission) {
        case 'developer':
            permission = (message.author.id == config.ownerID);
            break;
        case 'owner':
            permission = (message.member == message.guild.owner);
            break;
        case 'administrators':
            permission = (message.member.hasPermission('ADMINISTRATOR'));
            break;
        case 'moderators':
            permission = (message.guild.id == tlg.id
                ? message.member.roles.cache.find(r => r.id == tlg.modRoleID)
                    || message.member.hasPermission('ADMINISTRATOR')
                : message.member.hasPermission('ADMINISTRATOR'));
            break;
        case 'dungeonmasters':
            permission = (message.guild.id == tlg.id
                ? message.member.roles.cache.find(r => r.id == tlg.dmRoleID)
                    || message.member.roles.cache.find(r => r.id == tlg.modRoleID)
                    || message.member.hasPermission('ADMINISTRATOR')
                : message.member.hasPermission('ADMINISTRATOR'));
            break;
        case 'special':
            permission = (message.member.hasPermission(command.permList, {checkAdmin: true, checkOwner: true}));
            break;
        case 'everyone':
            permission = true;
            break;
        default:
            permission = (message.author.id == config.ownerID);
            break;
    }
    if (!permission)
        return message.reply(pickRandom(replies[command.permission]));
    //#endregion Check caller's permissions
    
    //#region Execute the command
    try {
        command.execute(client, message, args);
    } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
    //#endregion Execute the command
}