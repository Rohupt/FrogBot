const config = require('../Data/config.json');

module.exports = (client) => {
    console.log(`\nConnected as ` + client.user.tag);
    client.user.setActivity(`${config.developerMode ? 'the dev only' : 'everyone'}`, {type: 'LISTENING'});
};