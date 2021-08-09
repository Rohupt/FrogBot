require('module-alias/register');
require('dotenv').config();
const Discord = require('discord.js');
const util = require('@util/utilities.js');
const constants = require('@data/constants.json');
const watcher = require('./watcher.js');

var client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
        Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
    ],
});
client.commands = new Discord.Collection();
client.calls = new Discord.Collection();
client.events = new Discord.Collection();
client.prefix = {};
client.util = util;
client.constants = constants;
client.login(process.env.TOKEN);

watcher.execute(client);