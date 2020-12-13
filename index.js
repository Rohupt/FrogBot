const Discord = require('discord.js');
const config = require('./Data/config.json');
const util = require('./utilities.js');
const watcher = require('./watcher.js');

var client = new Discord.Client();
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.events = new Discord.Collection();
client.token = config.token;
client.prefix = config.prefix;
client.util = util;
client.login(client.token);

watcher.execute(client);