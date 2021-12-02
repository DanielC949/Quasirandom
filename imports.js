const Discord = require('discord.js');
const axios = require('axios').default;
const cheerio = require('cheerio');
const fs = require('fs');
const https = require('https');
const intentFlags = Discord.Intents.FLAGS;
const intents = new Discord.Intents([
  intentFlags.GUILDS,
  intentFlags.GUILD_VOICE_STATES,
  intentFlags.GUILD_MEMBERS,
  intentFlags.GUILD_MESSAGES,
  intentFlags.GUILD_PRESENCES
]);
const client = new Discord.Client({ intents: intents });

module.exports = {
  axios: axios,
  cheerio: cheerio,
  fs: fs,
  https: https,
  discordClient: client
};
