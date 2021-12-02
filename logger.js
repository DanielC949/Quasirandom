const CONSTANTS = require('./constants.js');
const { fs } = require('./imports.js');

const Logger = () => {
  const logChannel = require('./serverready.js').getServer().channels.cache.get(CONSTANTS.guild_id);
  const logFile = fs.createWriteStream('data/Quasirandom/log.txt', {flags: 'a'});
  return {
    error: (msg, suppressSend = false) => {
      logFile.write(`${(new Date(Date.now())).toUTCString()}: [ERROR] ${msg}\n`);
      console.log('[ERROR] ' + msg);
      if (suppressSend) return;
      try {
        logChannel.send('[ERROR] ' + msg);
      } catch (e) { }
    },
    warn: (msg, suppressSend = false) => {
      logFile.write(`${(new Date(Date.now())).toUTCString()}: [WARNING] ${msg}\n`);
      console.log('[WARNING] ' + msg);
      if (suppressSend) return;
      try {
        logChannel.send('[WARNING] ' + msg);
      } catch (e) { }
    },
    info: (msg, suppressSend = false) => {
      logFile.write(`${(new Date(Date.now())).toUTCString()}: [INFO] ${msg}\n`);
      console.log('[INFO] ' + msg);
      if (suppressSend) return;
      try {
        logChannel.send('[INFO] ' + msg);
      } catch (e) { }
    },
    finalize: () => logFile.end()
  };
}
const LOGGER_INSTANCE = Logger();

module.exports = {
  Logger: LOGGER_INSTANCE
};
