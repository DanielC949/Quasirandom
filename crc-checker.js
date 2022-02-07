const client = require('./client.js');
const cheerio = require('cheerio');
const builder = require('@discordjs/builders');
const {
  WebScraperLib
} = require('./libs.js');
const Logger = require('./logger.js');
const server = require('./serverready.js').getServer();

const AQUATICS_HOURS_URL = 'https://crc.gatech.edu/about/hours/aquatics';

const DAY_REGEXES = [
  /^su(?:n(?:day)?)?$/i,
  /^m(?:on(?:day)?)?$/i,
  /^tu(?:es(?:day)?)?$/i,
  /^w(?:ed(?:nesday)?)?$/i,
  /^th(?:urs(?:day)?)?$/i,
  /^f(?:ri(?:day)?)?$/i,
  /^sa(?:t(?:urday)?)?$/i
];

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
        res.push($('td', e).last().text().split('\n').map(l => l.trim()).filter(l => l !== '').join(' '));
      }
    });
    if (res.length === 0) {
      return 'No times found for ' + date;
    }
    return `Hours for ${resdate}:\n${res.join('\n')}`;
  }

  function formatDate(ms) {
    const d = new Date(ms);
    return (d.getMonth() + 1) + '/' + d.getDate();
  }

  function parseDateArg(d) {
    if (!d) {
      return formatDate(Date.now());
    }

    let dayOfWeek;
    if (/^[01]?\d\/[0-3]?\d$/.test(d)) { //literal date
      return d;
    } else if (/\+\d+/.test(d)) { //relative date
      return formatDate(Date.now() + parseInt(d.slice(1)) * 3600 * 24 * 1000);
    } else if ((dayOfWeek = DAY_REGEXES.map(r => r.test(d)).indexOf(true)) >= 0) { //day of week string
      let d = new Date(Date.now());
      while (d.getDay() !== dayOfWeek) {
        d.setTime(d.getTime() + 3600 * 24 * 1000);
      }
      return formatDate(d.getTime());
    } else {
      return null;
    }
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
      const date = parseDateArg(interaction.options.getString('date'));
      if (date == null) {
        interaction.reply({
          content: 'Unknown date format ' + interaction.options.getString('date'),
          ephemeral: true
        });
        return;
      }
      const resp = await process(html, date);
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
