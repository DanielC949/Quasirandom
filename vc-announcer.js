const {
  discordClient: client,
  fs
} = require('./imports.js');
const {
  Lib,
  AjaxLib
} = require('./libs.js');
const { Logger } = require('./logger.js');
const server = require('./serverready.js').getServer();

function VCAnnouncer() {
  let watchedChannels, lastLive;

  async function voiceStateUpdate(oldState, newState) {
    const wasStreaming = oldState.streaming, isStreaming = newState.streaming;
    const member = newState.member;
    const now = Date.now();

    if (wasStreaming && !isStreaming) {
      lastLive.set(member.user.id, now);
      return;
    }

    if (!wasStreaming && isStreaming) {
      if (lastLive.get(member.user.id) > now - 300000) {
        return;
      }

      const channelPair = watchedChannels.filter(e => e.vc.id === newState.channelId)[0];
      sendStreamingAlert(member, channelPair?.text);
      return;
    }
  }

  async function sendStreamingAlert(member, channel) {
    if (!channel) {
      Logger.warn(`vc-announcer, sendStreamingAlert called with null channel`);
      return;
    }

    const game = member.presence?.activities.filter(e => e.type === 'PLAYING');

    try {
      channel.send(`${member.displayName} is streaming${game?.length > 0 ? ' ' + game?.[0].name : ''}`);
    } catch (e) {
      Logger.warn('vc-announcer, unable to send streaming alert: ' + e);
    }
  }

  return async function() {
    watchedChannels = JSON.parse(fs.readFileSync('data/vc-announcer/watched.json', 'utf8')).map(e => {
      e.vc = server.channels.cache.get(e.vc);
      e.text = server.channels.cache.get(e.text);
      return e;
    });

    lastLive = new Map();
    client.on('voiceStateUpdate', voiceStateUpdate);
  }
}

module.exports = {
  init: VCAnnouncer()
};
