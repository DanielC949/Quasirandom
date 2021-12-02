const {
  discordClient: client,
  fs
} = require('./imports.js');

const serverID = '743513988876337304';
let server;

module.exports = {
  prepare: async function() {
    let done = false;
    console.log('Logging in...');

    client.on('ready', () => {
      console.log(`Logged in as ${client.user.tag}!`);
      server = client.guilds.cache.get(serverID);

      //require('./gtc19.js').init(); //new data display method invalidates current approach, see https://github.com/adityaxdiwakar/gt-jpj-tracking
      require('./twitch-announcer.js').init();
      require('./vc-announcer.js').init();

      done = true;
    });
    await client.login(fs.readFileSync('data/Quasirandom/token', 'utf8'));

    while (!done) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  },
  getServer: function() {
    return server;
  }
}
