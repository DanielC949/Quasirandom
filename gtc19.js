const {
  cheerio,
  fs
} = require('./imports.js');
const {
  Lib,
  WebScraperLib
} = require('./libs.js');
const server = require('./serverready.js').getServer();

const GTHealthURL = 'https://health.gatech.edu/coronavirus/health-alerts';

const affectedStatement = '; all affected individuals are being notified as consistent with Georgia Department of Public Health.';
const onCampusCase = 'The student lives on campus and is returning home to isolate or moving to isolation housing provided by Georgia Tech Housing and Residence life' + affectedStatement;
const offCampusCase = 'The student lives off campus and is isolating away from campus' + affectedStatement;
const greekCase = 'The student lives in Greek Housing and is returning home to isolate or is isolating in Greek Housing with other affected individuals' + affectedStatement;

const updateChannelID = '743517963541282877', logChannelID = '743989111676993649';
let channelCovid, channelLog;

async function process(html) {
  let output = '';
  const $ = cheerio.load(html);
  const curCases = parseInt($('.super-block__teaser > table > tbody > tr > td').get(2).children[0].data);
  const numCases = parseInt(await fs.promises.readFile('cases.txt', 'utf8'));
  Lib.ensureWriteToFile('cases.txt', curCases + '');
  if (curCases - numCases === 0) {
    return null;
  }
  channelLog.send('New updates, ' + numCases + ' -> ' + curCases);
  output += `${curCases - numCases} new cases (${curCases} total): \n`;
  let rows = $('#node-558 > div > div > div > table > tbody > tr').slice(1, curCases - numCases + 1);

  if ($('td', rows[0]).get(0).children[0].data.charAt(0) === '*') {
    output += $('td', rows[0]).get(0).children[0].data + "\n\n";
    rows = rows.slice(1, rows.length);
  }
  const counts = {
    staff: 0,
    onCampus: 0,
    offCampus: 0,
    greek: 0,
    unknown: 0
  };
  for (let i = 0, lim = rows.length; i < lim; i++) {
    const curRow = $('td', rows[i]);
    const desc = WebScraperLib.stripNBSP(WebScraperLib.getRecursiveData(curRow.get(3)));
    if (Lib.getFirstWord(desc) !== 'The') {
      const smartDigits = /(\d+?)\s(?:more|additional)/i
      if (smartDigits.test(desc)) {
        let _num = parseInt(desc.match(smartDigits)[1]);
        lim -= _num + 1;
      } else {
        let _num = parseInt(desc.match(/\d+/)[0]);
        console.log('Multiple cases grouped but unable to parse with regex; using ' + _num);
        lim -= _num + 1;
      }
    }
    if (/staff|employee/.test(desc)) {
      counts.staff++;
    } else if (/on\scampus/.test(desc)) {
      counts.onCampus++;
    } else if (/off\scampus/.test(desc)) {
      counts.offCampus++;
    } else if (/Greek\sHousing/.test(desc)) {
      counts.greek++;
    } else {
      counts.unknown++;
    }

    const curDate = new Date(Date.now()).toLocaleString('en-US', {timeZone:'America/New_York', day:'numeric', month:'long', year:'numeric'});
    if (desc === onCampusCase) {
      if (curRow.get(2).children[0].data !== curDate)
        output += 'On campus student: ' + curRow.get(2).children[0].data + '\n';
    } else if (desc === offCampusCase) {
      if (curRow.get(2).children[0].data !== curDate)
        output += 'Off campus student: ' + curRow.get(2).children[0].data + '\n';
    } else if (desc === greekCase) {
      if (curRow.get(2).children[0].data !== curDate)
        output += 'Greek student: ' + curRow.get(2).children[0].data + '\n';
    } else {
      output += '\n' + curRow.get(1).children[0].data + ': ' +
        curRow.get(2).children[0].data + '\n' +
        desc + '\n\n';
    }
  }
  output += `Staff: ${counts.staff}, On-Campus: ${counts.onCampus}, Off-Campus: ${counts.offCampus}, Greek: ${counts.greek}` +
    (counts.unknown > 0 ? `, Unknown:${counts.unknown}` : '') + '\n';
  return output;
}

async function send() {
  const msg = await process(await WebScraperLib.scrape(GTHealthURL));
  if (msg === null || msg === '') {
    return;
  } else {
    for (let submsg of Lib.splitMsgOnLF(msg)) {
      channelCovid.send(submsg);
      await Lib.sleep(1750);
    }
  }
}

async function check() {
  channelLog.send('Checking at ' + new Date(Date.now()).toLocaleString('en-US', { timeZone:'America/New_York' }) + '\n');
  send().catch(err => console.log(err));
}

module.exports = {
  init: function() {
    channelCovid = server.channels.cache.get(updateChannelID);
    channelLog = server.channels.cache.get(logChannelID);
    check();
    setInterval(check, 3600000);
  }
}
