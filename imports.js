const Discord = require('discord.js');
const axios = require('axios').default;
const cheerio = require('cheerio');
const fs = require('fs');
const https = require('https');
const intents = new Discord.Intents([
  Discord.Intents.FLAGS.GUILDS,
  Discord.Intents.FLAGS.GUILD_VOICE_STATES,
  Discord.Intents.FLAGS.GUILD_MEMBERS,
  Discord.Intents.FLAGS.GUILD_MESSAGES,
  Discord.Intents.FLAGS.GUILD_PRESENCES
]);
const client = new Discord.Client({ intents: intents });
const djsBuilders = require('@discordjs/builders');
const djsREST = require('@discordjs/rest');
const djsDAT = require('discord-api-types/v9');

module.exports = {
  axios: axios,
  cheerio: cheerio,
  fs: fs,
  https: https,
  discordClient: client,
  djsBuilders: djsBuilders,
  djsREST: djsREST,
  djsDAT: djsDAT
};
