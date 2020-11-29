const {
  discordClient: client
} = require('./imports.js');

const serverID = '743513988876337304';
let server;

module.exports = {
  prepare: function() {
    client.on('ready', () => {
      console.log(`Logged in as ${client.user.tag}!`);
      server = client.guilds.cache.get(serverID);

      //require('./gtc19.js').init(); //new data display method invalidates current approach, see https://github.com/adityaxdiwakar/gt-jpj-tracking
      require('./twitch-announcer.js').init();
    });
  },
  getServer: function() {
    return server;
  }
}
