const client = require('./client.js');
const cheerio = require('cheerio');
const builder = require('@discordjs/builders');
const {
  WebScraperLib
} = require('./libs.js');
const Logger = require('./logger.js');
const server = require('./serverready.js').getServer();

const AQUATICS_HOURS_URL = 'https://crc.gatech.edu/about/hours/aquatics';

function CRCChecker() {
  async function process(html, date) {
    const $ = cheerio.load(html);
    let outerdiv = $('.super-block__title').filter((i, e) => $(e).text().trim() === 'McAuley Aquatic Center').first();
    if (!outerdiv) {
      Logger.warn('[CRC-CHECKER] table header not found, falling back to exhaustive search');
      outerdiv = $('*').filter((i, e) => $(e).text().trim() === 'McAuley Aquatic Center').first();
      if (!outerdiv) {
        return '[ERROR] Unable to find table header';
      }
    }
    const outertable = $('div', outerdiv.parent()).first();
    if (!outertable) {
      return '[ERROR] Unable to find table container';
    }
    const timestable = $('table', outertable).first();
    if (!timestable) {
      return '[ERROR] Unable to find hours table';
    }
    let res = [], resdate = undefined;
    $('tr', timestable).each((i, e) => {
      let d = $('td', e).first().text();
      if (d.endsWith(date)) {
        if (resdate !== undefined && resdate !== d) {
          return `[WARN] Mismatched dates: ${resdate} and ${d}`;
        }
        resdate = d;
        res.push($('td', e).last().text());
      }
    });
    if (res.length === 0) {
      return 'No times found for ' + date;
    }
    return `Open hours for ${resdate}:\n${res.join('\n')}`;
  }

  function getCurDate() {
    const now = new Date(Date.now());
    return (now.getMonth() + 1) + '/' + now.getDate();
  }

  async function check(interaction) {
    let html;
    try {
      html = await WebScraperLib.getPage(AQUATICS_HOURS_URL, true, { headers: {'Accept': 'text/html'} });
    } catch (e) {
      interaction.reply({
        content: 'Error while retriving page: ' + e,
        ephemeral: true
      });
      return;
    }

    try {
      const resp = await process(html, interaction.options.getString('date') ?? getCurDate());
      interaction.reply({
        content: resp,
        ephemeral: resp.charAt(0) === '['
      });
    } catch (e) {
      interaction.reply({
        content: 'Error while checking page: ' + e,
        ephemeral: true
      });
    }
  }

  return async function() {
    client.commandHeaders.push(
      new builder.SlashCommandBuilder()
      .setName('crccheck')
      .setDescription('Looks up CRC pool hours')
      .addStringOption(option =>
        option.setName('date')
        .setDescription('Date to look up, default value today')
        .setRequired(false)
      )
      .toJSON()
    );
    client.commands.set('crccheck', check);
  };
}

module.exports = {
  init: CRCChecker()
};
