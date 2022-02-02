const CONSTANTS = require('./constants.js');
const fs = require('fs');

function UTCDate() {
  return (new Date(Date.now())).toUTCString();
}

const Logger = () => {
  const logChannel = require('./serverready.js').getServer().channels.cache.get(CONSTANTS.log_channel_id);
  const logFile = fs.createWriteStream('data/Quasirandom/log.txt', {flags: 'a'});
  return {
    error: (msg, suppressSend = false) => {
      logFile.write(`${UTCDate()}: [ERROR] ${msg}\n`);
      console.log('[ERROR] ' + msg);
      if (suppressSend) return;
      try {
        logChannel.send('[ERROR] ' + msg);
      } catch (e) {
        LOGGER_INSTANCE.error(`${UTCDate()}: [ERROR] [LOGGER] logging error message to Discord: ${e}`);
      }
    },
    warn: (msg, suppressSend = false) => {
      logFile.write(`${(new Date(Date.now())).toUTCString()}: [WARN] ${msg}\n`);
      console.log('[WARN] ' + msg);
      if (suppressSend) return;
      try {
        logChannel.send('[WARN] ' + msg);
      } catch (e) {
        LOGGER_INSTANCE.error(`${UTCDate()}: [ERROR] [LOGGER] logging warn message to Discord: ${e}`);
      }
    },
    info: (msg, suppressSend = false) => {
      logFile.write(`${(new Date(Date.now())).toUTCString()}: [INFO] ${msg}\n`);
      console.log('[INFO] ' + msg);
      if (suppressSend) return;
      try {
        logChannel.send('[INFO] ' + msg);
      } catch (e) {
        LOGGER_INSTANCE.error(`${UTCDate()}: [ERROR] [LOGGER] logging info message to Discord: ${e}`);
      }
    },
    finalize: () => logFile.end()
  };
}
const LOGGER_INSTANCE = Logger();

module.exports = LOGGER_INSTANCE;
