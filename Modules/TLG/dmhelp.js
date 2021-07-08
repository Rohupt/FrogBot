const Discord = require('discord.js');
const {sep} = require('path');
const name = __filename.split(sep)[__filename.split(sep).length - 1].replace(/\.[^/.]+$/, "");
const mod = __dirname.split(sep)[__dirname.split(sep).length - 1];
const aliases = [];

module.exports = {
    name, aliases,
    module: mod,
    channelType: 1, //-1: direct message only, 0: both, 1: guild channel only
    permission: 'dungeonmasters',
    userPermissionList: [],
    botPermissionList: [],
    minArguments: 0,
    
    description: "Show the help for DMs.",
    usage: `\`<commandname>\``,

    async execute(client, message, args, joined, embed) {
        message.channel.send(embed.setDescription(
            "Below are some useful commands:\n\n" +
            "`campaign`/`camp` View campaigns list, or details of a campaign (use `--this` option inside a campaign channel to view that campaign's details);\n" +
            "`playerinfo`/`pi` View character sheet and token link;\n" +
            "`modifycampplayers`/`mcp` Add or remove players to/from your campaign;\n" +
            "`modifycampobservers`/`mco` Add or remove observers to/from your campaign (†);\n" +
            "`modifycampinfo`/`mci` Modify details like status and description of the campaign;\n" +
            "`modifyplayerinfo`/`mpi` Modify character sheet and token link;\n" +
            "`help` is useful to view how to use a certain command.\n\n" +
            "(†) Observers are not players, but can watch the camp. Observers can talk in discussion channels, but not roleplay channels.\n\n" +
            "Please remember to set your camp's status to `1`/`\"Finding players\"`, `2`/`\"Waiting for start\"`, `3`/`Running` or `4`/`Paused` (DO include the double quotes) when necessary.\n\n" +
            "**Have fun with your game! NAT 20!**"
        ));
    },
};