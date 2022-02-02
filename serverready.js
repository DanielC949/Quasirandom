const client = require('./client.js');
const REST = require('@discordjs/rest');
const DAT = require('discord-api-types/v9');
const builder = require('@discordjs/builders');

const CONSTANTS = require('./constants.js');
let server;

module.exports = {
  prepare: async function() {
    console.log('Logging in...');

    let done = false;

    client.on('ready', async () => {
      console.log(`Logged in as ${client.user.tag}!`);
      server = client.guilds.cache.get(CONSTANTS.guild_id);

      //require('./gtc19.js').init(); //new data display method invalidates current approach, see https://github.com/adityaxdiwakar/gt-jpj-tracking
      await require('./twitch-announcer.js').init();
      await require('./vc-announcer.js').init();
      await require('./crc-checker.js').init();

      const rest = new REST.REST({ version: '9' }).setToken(CONSTANTS.client_token);
      for (let cmdh of client.commandHeaders) {
        if (cmdh instanceof builder.SlashCommandBuilder) {
          throw new Error('Convert slash commands to json');
        }
      }
      try {
        rest.put(DAT.Routes.applicationGuildCommands(CONSTANTS.client_id, CONSTANTS.guild_id), { body: client.commandHeaders });
      } catch (e) {
        Logger.error(`[REST] Slash command registration failed: ${e.message}`);
      }
      done = true;
    });

    await client.login(CONSTANTS.client_token);

    while (!done) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  },
  getServer: function() {
    return server;
  }
}
