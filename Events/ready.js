const mongoose = require('@util/mongoose.js');

module.exports = async (client) => {
    await mongoose();
    console.log(`Connected as ${client.user.tag}\t(time: ${process.uptime()}s)`);
    client.developerMode = (await client.util.config()).developerMode;
    client.user.setActivity(`${client.developerMode ? 'the dev only' : 'everyone'}`, {type: 'LISTENING'});
};