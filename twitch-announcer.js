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

const alertChannelID = '782339361450098718';

function StreamAnnouncer() {
  let channelAlerts, oauth, followedChannels = [];

  async function reportLive() {
    await updateTokenExpiration();
    for (let channel of followedChannels) {
      let res = await getChannel(channel);
      if (!res) {
        continue;
      }
      if (res.started_at !== '' && channel.started_at !== res.started_at && res.display_name === channel.display_name) {
        channel.started_at = res.started_at;
        channelAlerts.send(`${res.display_name} is live: ${res.title}`);
      }
    }
    fs.promises.writeFile('data/twitch-announcer/following.json', JSON.stringify(followedChannels));
  }

  async function getChannel(channelName) {
    const headers = {'client-id': oauth.client_id, 'Authorization': 'Bearer ' + oauth.cur_token};
    let res = JSON.parse(await AjaxLib.httpsget('https://api.twitch.tv/helix/search/channels?query=' + channelName + '&first=1', headers));
    if (res.status && res.status !== 200) {
      Logger.error('in twitch-announcer, getChannel(): ' + res.status);
    }
    return res.data.length > 0 && res.data[0].display_name === channelName ? res.data[0] : null;
  }

  async function updateTokenExpiration() {
    const headers = {'Authorization': 'OAuth ' + oauth.cur_token};
    let token = JSON.parse(await AjaxLib.httpsget('https://id.twitch.tv/oauth2/validate', headers));
    if (token.status === 401) {
      await refreshToken();
    } else {
      Logger.error('in twitch-announcer, updateTokenExpiration(), returned ' + token.status);
    }
  }

  async function refreshToken() {
    let token = JSON.parse(await AjaxLib.httpspost(`https://id.twitch.tv/oauth2/token?client_id=${oauth.client_id}&client_secret=${oauth.client_secret}&grant_type=client_credentials`, null, null));
    if (token.access_token) {
      oauth.cur_token = token.access_token;
      fs.promises.writeFile('data/twitch-announcer/oauth.json', JSON.stringify(oauth));
      Logger.info('in twitch-announcer: refreshed OAuth token');
    } else {
      Logger.error('in twitch-announcer, refreshToken(), returned ' + token.status);
    }
  }

  async function bindCommands() {
    client.on('message', async message => {
      if (message.channel.id !== alertChannelID) {
        return;
      }
      let msg = message.content.toLowerCase().split(' ');
      if (msg.length === 0) return;
      if (msg.length === 2 && msg[0] === '!follow') {
        for (let channel of followedChannels) {
          if (channel.display_name === msg[1]) {
            channelAlerts.send('Already following ' + msg[1]);
            return;
          }
        }
        followedChannels.push({display_name: msg[1], started_at: ''});
        channelAlerts.send('Now following ' + msg[1]);
        fs.promises.writeFile('data/twitch-announcer/following.json', JSON.stringify(followedChannels));
        if (await getChannel(msg[1]) === null) {
          channelAlerts.send('Warning: ' + msg[1] + ' has not streamed recently or does not exist');
        }
      } else if (msg.length == 2 && msg[0] === '!unfollow') {
        for (let i = 0; i < followedChannels.length; i++) {
          if (followedChannels[i].display_name === msg[1]) {
            channelAlerts.send('Unfollowed ' + msg[1]);
            followedChannels.splice(i, 1);
            fs.promises.writeFile('data/twitch-announcer/following.json', JSON.stringify(followedChannels));
            return;
          }
        }
        channelAlerts.send(msg[1] + ' not found');
      } else if (msg[0] === '!followlist') {
        let channels = [];
        for (let channel of followedChannels) {
          channels.push(channel.display_name);
        }
        channelAlerts.send(channels.join(', '));
      }
    });
  }

  return function() {
    channelAlerts = server.channels.cache.get(alertChannelID);
    bindCommands();
    oauth = JSON.parse(fs.readFileSync('data/twitch-announcer/oauth.json', 'utf8'));
    followedChannels = JSON.parse(fs.readFileSync('data/twitch-announcer/following.json', 'utf8'));
    setInterval(() => {
      try {
        reportLive();
      } catch (e) {
        Logger.error('in twitch-announcer: ' + e);
      }
    }, 60000);
  }
}

module.exports = {
  init: StreamAnnouncer()
}
