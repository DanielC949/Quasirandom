const Discord = require('discord.js');
const axios = require('axios').default;
const cheerio = require('cheerio');
const fs = require('fs');
const client = new Discord.Client();

module.exports = {
  axios: axios,
  cheerio: cheerio,
  fs: fs,
  discordClient: client
};
