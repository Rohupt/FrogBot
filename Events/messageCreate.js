const {pickRandom} = require('mathjs');
const replies = require('@data/replies.json');
const tlg = require('@data/tlg.json');

function getArgs(message) {
    var doubleDoubleQuote = '<DDQ>', spaceMarker = '<SP>', newLineMarker = '<NL>', tabMarker = '<T>';
    while (message.indexOf(doubleDoubleQuote) > -1) doubleDoubleQuote += '@';
    while (message.indexOf(spaceMarker) > -1) spaceMarker += '@';
    while (message.indexOf(newLineMarker) > -1) newLineMarker += '@';
    while (message.indexOf(tabMarker) > -1) tabMarker += '@';

    // Replace double double quotes with markers
    const ddqReplaced = message
        .replace( /(?<=")""(?=")/g, doubleDoubleQuote)
        .replace( /(?<=[ \n\t])"""(?=[ \n\t])/g, doubleDoubleQuote + '"' + doubleDoubleQuote)
        .replace( /(?<=[ \n\t])"""/g, '"' + doubleDoubleQuote)
        .replace( /"""(?=[ \n\t])/g, doubleDoubleQuote + '"')
        .replace( /""/g, doubleDoubleQuote);
    // Replace spaces, tabs, newlines in double-quoted args with markers; and ddq markers with single dq
    const wsReplaced = ddqReplaced.replace(/"([^"]*)"?/g, (fullMatch, capture) => {
        return capture.replace(/ /g, spaceMarker).replace(/\t/g, tabMarker).replace(/\n/g, newLineMarker)
            .replace(RegExp(doubleDoubleQuote, 'g'), '"');
    });
    // Split the arguments
    const argsSplit = wsReplaced.trim().split(/[ \n\t]+/);
    // Change the markers back to whitespaces; remove any ddq left
    const args = argsSplit.map((mangledParam) => {
        return mangledParam
            .replace(RegExp(spaceMarker, 'g'), ' ').replace(RegExp(tabMarker, 'g'), '\t').replace(RegExp(newLineMarker, 'g'), '\n')
            .replace(RegExp(doubleDoubleQuote, 'g'), '');
    });

    // Additional part for joining purpose
    //#region Addition
    const originalwsReplaced = ddqReplaced.replace(/"([^"]*)"?/g, (fullMatch, capture) => {
        return fullMatch.replace(/ /g, spaceMarker).replace(/\t/g, tabMarker).replace(/\n/g, newLineMarker)
            .replace(RegExp(doubleDoubleQuote, 'g'), '""');
    });
    
    const originalSplit = originalwsReplaced.trim().split(/[ \n\t]+/);
    
    const originalParams = originalSplit.map((mangledParam) => {
        return mangledParam
            .replace(RegExp(spaceMarker, 'g'), ' ').replace(RegExp(tabMarker, 'g'), '\t').replace(RegExp(newLineMarker, 'g'), '\n')
            .replace(RegExp(doubleDoubleQuote + '"""', 'g'), '"""')
            .replace(RegExp('"""' + doubleDoubleQuote, 'g'), '"""')
            .replace(RegExp(doubleDoubleQuote, 'g'), '""');
    });

    args.indexes = [], currentIndex = 0;
    for (let i = 1; i < originalSplit.length; i++) {
        let temp = message.slice(currentIndex + (i == 0 ? 0 : originalParams[i-1].length));
        currentIndex += temp.indexOf(originalParams[i]) + (i == 0 ? 0 : originalParams[i-1].length);
        args.indexes.push(currentIndex);
    };

    args.joinArgs = (startIndex = 0, endIndex = args.length) => {
        endIndex = (endIndex === undefined || endIndex > args.length) ? args.length : endIndex;
        startIndex += startIndex < 0 ? args.length : 0;
        endIndex += endIndex < 0 ? args.length : 0;
        
        if (endIndex < startIndex || startIndex >= args.length) return "";
        return message.slice(args.indexes[startIndex], args.indexes[endIndex - 1] + originalParams[endIndex].length);
    };
    //#endregion Addition

    return args;
}

function getCommandAndArgs(client, message, prefix) {
    const actualPrefix = message.content.startsWith(prefix) ? prefix : `<@!${client.user.id}>`;
    const args = getArgs(message.content.slice(actualPrefix.length));
    const commandName = args.shift();
    const joined = args.joinArgs();
    const command = client.commands.get(client.calls.get(commandName.toLowerCase()));
    return {command, args, joined};
}

function commandLog(message, command, args, joined) {
    const isDM = message.channel.type == 'dm';
    return console.log(`\n\nCommand received: ${command.name}\n`
        + `Guild\t\t: ${isDM ? 'None' : message.guild.name}${!isDM ? ' (' + message.guild.id + ')' : ''}\n`
        + `Channel\t\t: ${isDM ? 'Direct Message' : message.channel.name} (${message.channel.id})\n`
        + `Caller\t\t: ${message.author.tag} (${message.author.id})\n`
        + `Time\t\t: ${message.createdAt.toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}\n`
        + `Arguments\t: [${args.map(arg => arg.replace('\n', '\\n').replace('\t', '\\t')).join(', ')}]\n`
        + `Joined Args\t: {${joined}}\n`);
}

function checkChannel(message, command, embed) {
    if ((message.channel.type == 'dm' && command.channelType == 1) || (message.channel.type != 'dm' && command.channelType == -1)) {
        message.channel.send({embeds: [embed.setDescription('You cannot use that command here. Please refer to `help` for more details.')]});
        return false;
    }
    return true;
}

function checkUserPermission(message, command) {
    switch (command.permission) {
        case 'developer':
            return (message.author.id == process.env.OWNER_ID);
        case 'owner':
            return (message.member == message.guild.owner);
        case 'administrators':
            return (message.member.permissions.has('ADMINISTRATOR'));
        case 'moderators':
            return (message.guild.id == tlg.id
                ? message.member.roles.cache.find(r => r.id == tlg.modRoleID)
                    || message.member.permissions.has('ADMINISTRATOR')
                : message.member.permissions.has('ADMINISTRATOR'));
        case 'dungeonmasters':
            return (message.guild.id == tlg.id
                ? message.member.roles.cache.find(r => r.id == tlg.dmRoleID)
                    || message.member.roles.cache.find(r => r.id == tlg.modRoleID)
                    || message.member.permissions.has('ADMINISTRATOR')
                : message.member.permissions.has('ADMINISTRATOR'));
        case 'role':
            
            break;
        case 'special':
            return (message.member.permissions.has(command.userPermissionList, {checkAdmin: true, checkOwner: true}));
        case 'everyone':
            return true;
        default:
            return (message.author.id == process.env.OWNER_ID);
    }
}

function checkBotPermission(message, command, embed) {
    if (message.channel.type == 'dm') return true;
    if (!message.guild.me.permissions.has([...command.botPermissionList, 'SEND_MESSAGES'], {checkAdmin: true, checkOwner: true})) {
        embed.setDescription('Cannot execute the command because the bot lacks the following permissions:\n'
            + `\`${command.botPermissionList.filter(p => !message.guild.me.permissions.toArray().includes(p)).join('`, `')}\``);
        message.channel.send({embeds: [embed]});
        return false;
    };
    return true;
}

async function executeCommand(client, message) {
    if (message.author.bot) return;
    //check prefix
    var prefix = await client.util.commandPrefix(client, message);
    if ((!message.content.startsWith(`<@!${client.user.id}>`) && !message.content.startsWith(prefix)) || (message.content.startsWith(prefix + ' '))) return;
    
    //check developerMode
    if ((await client.util.config()).developerMode && message.author.id != process.env.OWNER_ID)
        return message.reply(pickRandom(replies.developerMode));
    
    //get command
    var {command, args, joined} = getCommandAndArgs(client, message, prefix);
    if (!command) return;
    commandLog(message, command, args, joined);

    //check channel type
    let embed = client.util.newReturnEmbed(message);
    if (!checkChannel(message, command, embed)
        || command.module == 'TLG' && (message.channel.type == 'dm' || message.guild.id != tlg.id)
        || command.module == 'Textgame' && (message.channel.type == 'dm' || message.guild.id != '687598549344452629')) {
        embed.setDescription('This command is not for this channel/server. Please refer to `help` for more information.');
        return message.channel.send({embeds: [embed]});
    }

    //check number of arguments
    if (args.length < command.minArguments) {
        embed.setDescription(`There are not enough arguments to execute that command.\n`
            + `You provided \`${args.length}\` ${args.length > 1 ? 'arguments' : 'argument'}, but at least \`${command.minArguments}\` ${command.minArguments > 1 ? 'are' : 'is'} needed.\n`
            + `Please refer to \`${prefix}help ${command.name}\` for more info.`);
        return message.channel.send({embeds: [embed]});
    }
    
    //check permissions
    if (!checkUserPermission(message, command))
        return message.reply(pickRandom(replies[command.permission]));
    if (!checkBotPermission(message, command, embed)) return;
    
    try {
        await command.execute(client, message, args, joined, embed)
    } catch (error) {
        throw error;
    }
    console.log('Command executed successfully.\n');
}

module.exports = async (client, message) => {
    
    try { await executeCommand(client, message); }
    catch (error) {
        console.error(error);
        message.reply("there was an error trying to execute that command!");
    }
}