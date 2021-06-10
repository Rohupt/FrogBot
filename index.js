require('module-alias/register');
require('dotenv').config();
const Discord = require('discord.js');
const util = require('@util/utilities.js');
const watcher = require('./watcher.js');

var client = new Discord.Client();
client.commands = new Discord.Collection();
client.calls = new Discord.Collection();
client.events = new Discord.Collection();
client.prefix = {};
client.util = util;
client.login(process.env.TOKEN);

watcher.execute(client);