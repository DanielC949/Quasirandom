const {
  discordClient: client,
  fs
} = require('./imports.js');
const {
  Lib,
  AjaxLib,
  Logger
} = require('./libs.js');
const server = require('./serverready.js').getServer();

function VCAnnouncer() {
  let watchedChannels, lastLive;

  async function checkStreaming() {
    const now = Date.now();
    for (let e of lastLive) {
      if (e[1] - now > 300000) {
        lastLive.delete(e[0]);
      }
    }
    for (let watch of watchedChannels) {
      for (let user of watch.vc.members) {
        user = user[1];
        if (!lastLive.has(user.id) && user.voice.streaming) {
          const game = user.presence.activities.filter(e => e.type === 'PLAYING');
          try {
            watch.text.send(`${user.displayName} is streaming${game.length > 0 ? ' ' + game[0].name : ''}`);
          } catch (e) {
            continue;
          }
          lastLive.set(user.id, now);
        }
      }
    }
  }

  return function() {
    watchedChannels = JSON.parse(fs.readFileSync('data/vc-announcer/watched.json', 'utf8')).map(e => {
      e.vc = server.channels.cache.get(e.vc);
      e.text = server.channels.cache.get(e.text);
      return e;
    });
    lastLive = new Map();
    setInterval(() => {
      try {
        checkStreaming();
      } catch (e) { }
    }, 10000);
  }
}

module.exports = {
  init: VCAnnouncer()
};
