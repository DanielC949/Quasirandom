const {
  discordClient: client,
  fs,
  djsBuilders: builder
} = require('./imports.js');
const {
  Lib,
  AjaxLib
} = require('./libs.js');
const { Logger } = require('./logger.js');
const server = require('./serverready.js').getServer();

const CONSTANTS = require('./constants.js');

function StreamAnnouncer() {
  let channelAlerts, oauth, followedChannels = [], lastSeen = new Map();

  async function reportLive() {
    if (await checkTokenExpiration() === null) {
      return;
    }
    const now = Date.now();
    for (let e of lastSeen) {
      if (now - e[1] > 600000) {
        lastSeen.delete(e[0]);
      }
    }
    for (let channel of followedChannels) {
      let res = await getChannel(channel.display_name);
      if (!res?.is_live) {
        continue;
      }
      if (channel.started_at !== res.started_at) {
        if (!lastSeen.has(channel.display_name)) {
          try {
            channelAlerts.send(`${Lib.discordEscape(res.display_name)} is live: ${Lib.discordEscape(res.title)}`);
          } catch {
            continue;
          }
        }
        channel.started_at = res.started_at;
      }
      lastSeen.set(channel.display_name, now);
    }
    fs.promises.writeFile('data/twitch-announcer/following.json', JSON.stringify(followedChannels));
  }

  async function getChannel(channelName) {
    const headers = {'client-id': oauth.client_id, 'Authorization': 'Bearer ' + oauth.cur_token};
    let res;
    try {
      let getreq = await AjaxLib.httpsget('https://api.twitch.tv/helix/search/channels?query=' + channelName + '&first=1', headers);
      res = JSON.parse(getreq);
    } catch (e) {
      return null;
    }
    if (res.status && res.status !== 200) {
      Logger.error('[twitch-announcer::getChannel()]: ' + res.status);
    }
    return res.data?.length > 0 && res.data[0].display_name.toLowerCase() === channelName ? res.data[0] : null;
  }

  async function checkTokenExpiration() {
    const headers = {'Authorization': 'OAuth ' + oauth.cur_token};
    let token;
    try {
      let res = await AjaxLib.httpsget('https://id.twitch.tv/oauth2/validate', headers);
      token = JSON.parse(res);
    } catch (e) {
      return null;
    }
    if (token.status === 401) {
      await refreshToken();
    }
  }

  async function refreshToken() {
    let token;
    try {
      let res = await AjaxLib.httpspost(`https://id.twitch.tv/oauth2/token?client_id=${oauth.client_id}&client_secret=${oauth.client_secret}&grant_type=client_credentials`, null, null)
      token = JSON.parse(res);
    } catch (e) {
      return null;
    }
    if (token.access_token) {
      oauth.cur_token = token.access_token;
      fs.promises.writeFile('data/twitch-announcer/oauth.json', JSON.stringify(oauth));
      Logger.info('[twitch-announcer] refreshed OAuth token');
    } else {
      Logger.error('[twitch-announcer::refreshToken()] returned ' + token.status);
    }
  }

  async function bindCommands() {
    client.commandHeaders.push(
      new builder.SlashCommandBuilder()
      .setName('follow')
      .setDescription('Follows this Twitch channel')
      .addStringOption(option =>
        option.setName('channel')
        .setDescription('Channel to follow')
        .setRequired(true)
      )
      .toJSON()
    );
    client.commands.set('follow', async interaction => {
      if (interaction.channelId !== CONSTANTS.twitch_alerts_channel_id) {
        interaction.reply({
          content: 'Command \'follow\' is not available in this channel',
          ephemeral: true
        });
        return;
      }
      const newChannel = interaction.options.getString('channel').toLowerCase();
      for (let channel of followedChannels) {
        if (channel.display_name === newChannel) {
          interaction.reply({
            content: `Already following ${newChannel}`,
            ephemeral: true
          });
          return;
        }
        followedChannels.push({
          display_name: newChannel,
          started_at: ''
        });
        fs.promises.writeFile('data/twitch-announcer/following.json', JSON.stringify(followedChannels));
        if (await getChannel(newChannel) === null) {
          interaction.reply(`Now following ${newChannel}\nWarning: ${newChannel} has not streamed recently or does not exist`);
        } else {
          interaction.reply(`Now following ${newChannel}`);
        }
      }
    });

    client.commandHeaders.push(
      new builder.SlashCommandBuilder()
      .setName('unfollow')
      .setDescription('Unfollows this Twitch channel')
      .addStringOption(option =>
        option.setName('channel')
        .setDescription('Channel to unfollow')
        .setRequired(true))
      .toJSON()
    );
    client.commands.set('unfollow', async interaction => {
      const channel = interaction.options.getString('channel').toLowerCase();
      for (let i = 0; i < followedChannels.length; i++) {
        if (followedChannels[i].display_name === channel) {
          interaction.reply('Unfollowed ' + channel);
          followedChannels.splice(i, 1);
          fs.promises.writeFile('data/twitch-announcer/following.json', JSON.stringify(followedChannels));
          return;
        }
      }
      interaction.reply({
        content: `${channel} not found`,
        ephemeral: true
      });
    });

    client.commandHeaders.push(
      new builder.SlashCommandBuilder()
      .setName('followlist')
      .setDescription('Lists all followed channels')
      .toJSON()
    );
    client.commands.set('followlist', async interaction => {
      let channels = [];
      for (let channel of followedChannels) {
        channels.push(channel.display_name);
      }
      if (channels.length === 0) {
        interaction.reply('No followed channels');
      } else {
        interaction.reply(channels.join(', '));
      }
    });

    client.commandHeaders.push(
      new builder.SlashCommandBuilder()
      .setName('check')
      .setDescription('Checks for channels which recently started streaming')
      .toJSON()
    );
    client.commands.set('check', async interaction => reportLive());
  }

  return async function() {
    channelAlerts = server.channels.cache.get(CONSTANTS.twitch_alerts_channel_id);
    await bindCommands();
    oauth = JSON.parse(await fs.promises.readFile('data/twitch-announcer/oauth.json', 'utf8'));
    followedChannels = JSON.parse(await fs.promises.readFile('data/twitch-announcer/following.json', 'utf8'));
    setInterval(() => {
      try {
        reportLive();
      } catch (e) {
        Logger.error('[twitch-announcer] ' + e);
      }
    }, 60000);
    try {
      reportLive();
    } catch (e) {
      Logger.error('[twitch-announcer] ' + e);
    }
  }
}

module.exports = {
  init: StreamAnnouncer()
};
