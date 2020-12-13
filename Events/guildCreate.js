const ejf = require('edit-json-file');
var config = require('../Data/config.json');

module.exports = (client, guild) => {
    let configejs = ejf('./Data/config.json', {
        stringify_width: 4,
        autosave: true
    });
    configejs.set(`prefix\.${guild.id}`, config.prefix.default);
    client.prefix[message.guild.id] = newprefix;
    delete require.cache[require.resolve('../Data/config.json')];
    config = require('../Data/config.json');
    guild.me.setNickname(`ValderBot (${config.prefix.default})`);
}