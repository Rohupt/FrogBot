const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [name, 'rl'];

module.exports = {
    name: name,
    module: mod,
    aliases: aliases,
    permission: 'developer',
    
    description: 'List all roles of the server.',

    execute(client, message, args) {
        const roles = message.guild.roles.cache;
        const roleList = Array.from(roles.values()).sort((a, b) => {
            if (args.includes('-s'))
                return a.position - b.position;
            if (args.includes('-r'))
                return b.position - a.position;
            return a < b ? -1 : a == b ? 0 : 1;
        });
        var reply = ``;
        const pad = Math.floor(Math.log10(roles.size)) + 1;

        roleList.forEach((role, index) => {
            reply += `\`#${(index + 1).toString().padStart(pad)} (${role.position.toString().padStart(pad)}/${role.rawPosition.toString().padStart(pad)}): ${role.name}\`\n`;
        });
        message.channel.send(reply, {split: true});
    },
};