const Discord = require('discord.js');
const axios = require('axios').default;
const cheerio = require('cheerio');
const fs = require('fs');
const https = require('https');
const client = new Discord.Client();
const dns = require('dns');

module.exports = {
  axios: axios,
  cheerio: cheerio,
  fs: fs,
  https: https,
  discordClient: client,
  dns: dns
};
