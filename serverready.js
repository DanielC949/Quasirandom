const {
  discordClient: client,
  djsREST: REST,
  djsDAT: DAT,
  djsBuilders: builder
} = require('./imports.js');

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

      const rest = new REST.REST({ version: '9' }).setToken(CONSTANTS.client_token);
      for (let cmdh of client.commandHeaders) {
        if (cmdh instanceof builder.SlashCommandBuilder) {
          throw new Error('Convert slash commands to json');
        }
      }
      try {
        rest.put(DAT.Routes.applicationGuildCommands(CONSTANTS.client_id, CONSTANTS.guild_id), { body: client.commandHeaders });
      } catch (e) {
        e.message = `[REST] Slash command registration failed: ${e.message}`;
        throw e;
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
