const chokidar = require('chokidar');
const path = require('path');
var watcher = chokidar.watch('./', {ignored: ['./Tests', /(^|[\/\\])\../], cwd: '.'});

module.exports = {
    watcher: watcher,
    execute(client) {
        watcher.isReady = false;
        watcher
            .on('ready', () => {
                watcher.isReady = true;
                console.log("Watcher ready time: " + process.uptime() + " s.");
            })
            .on('change', filePath => {
                const dirs = filePath.split(path.sep);
                const name = [dirs[dirs.length - 2], dirs[dirs.length - 1].replace(/\.[^/.]+$/, "")];
                delete require.cache[require.resolve('./' + filePath)];
                switch (dirs[0]) {
                    case 'Modules':
                        client.aliases.forEach((value, key) => {
                            if (value == name[1])
                                client.aliases.delete(key);
                        });
                        client.commands.delete(name[1]);
                        const command = require('./' + filePath);
                        if (!command) {
                            console.log('Cannot find command');
                            break;
                        };
                        client.commands.set(command.name, command);
                        if (!command) {
                            console.log(`Cannot load command ${name.join('/')} aliases`);
                        };
                        command.aliases.forEach(alias => {
                            client.aliases.set(alias, command.name);
                        });
                        client.commands.delete(undefined);
                        console.log(`Updated Command: ${name.join('/')}`);
                        break;
                    case 'Events':
                        const event = require('./' + filePath);
                        client.removeAllListeners(name[1]);
                        client.on(name[1], event.bind(null, client));
                        console.log(`Updated Event: ${name[1]}`);
                        break;
                    case 'node_modules':
                        break;
                    case 'utilities.js':
                        delete require.cache[require.resolve('./' + filePath)];
                        client.util = require('./utilities.js');
                    default:
                        console.log(`Updated File: ${filePath}`);
                        break;
                };
            })
            .on('add', filePath => {
                const dirs = filePath.split(path.sep);
                const name = [dirs[dirs.length - 2], dirs[dirs.length - 1].replace(/\.[^/.]+$/, "")];
                switch (dirs[0]) {
                    case 'Modules':
                        if (!client.commands.has(name[1]) && filePath.endsWith('.js')) {
                            const command = require('./' + filePath);
                            client.commands.set(command.name, command);
                            if (command.aliases) {
                                command.aliases.forEach(alias => {
                                    client.aliases.set(alias, command.name);
                                });
                            } else client.aliases.set(command.name, command.name);
                            if (watcher.isReady) console.log(`Added Command: ${name.join('/')}`);
                        };
                        client.commands.delete(undefined);
                        break;
                    case 'Events':
                        if (!client.events.has(name[1]) && filePath.endsWith('.js')) {
                            const event = require('./' + filePath);
                            client.on(name[1], event.bind(null, client));
                            delete require.cache[require.resolve('./' + filePath)];
                            client.events.set(name[1], event);
                            if (watcher.isReady) console.log(`Added Event: ${name[1]}`);
                        }
                        break;
                    case 'node_modules':
                        break;
                    default:
                        if (watcher.isReady) console.log(`Added File: ${filePath}`);
                        break;
                };
            })
            .on('unlink', filePath => {
                const dirs = filePath.split(path.sep);
                const name = [dirs[dirs.length - 2], dirs[dirs.length - 1].replace(/\.[^/.]+$/, "")];
                switch (dirs[0]) {
                    case 'Modules':
                        client.aliases.forEach((value, key) => {
                            if (value == name[1])
                                client.aliases.delete(key);
                        });
                        client.commands.delete(name[1]);
                        console.log(`Deleted Command: ${name.join('/')}`);
                        break;
                    case 'Events':
                        client.events.delete(name[1]);
                        console.log(`Deleted Event: ${name[1]}`);
                        break;
                    case 'node_modules':
                        break;
                    default:
                        console.log(`Deleted File: ${filePath}`);
                        break;
                };
            })
            .on('addDir', dir => {
                if (dir.split(path.sep)[0] != 'node_modules')
                if (watcher.isReady) console.log(`Added Directory: ${dir}`)
            })
            .on('unlinkDir', dir => {
                if (dir.split(path.sep)[0] != 'node_modules')
                    console.log(`Deleted Directory: ${dir}`)
            })
            .on('error', error => console.log(`Watcher error: ${error}.`));
    },
};
