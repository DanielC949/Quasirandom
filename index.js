const {
  discordClient: client,
  fs
} = require('./imports.js');

async function init() {
  await require('./serverready.js').prepare();

  const { Logger } = require('./logger.js');

  process.on('uncaughtException', (error, origin) => {
    onExit(`${(new Date(Date.now())).toUTCString()}: [ERROR (uncaughtException)] ${error}\n`);
  });
  process.on('unhandledRejection', (reason, promise) => {
    onExit(`${(new Date(Date.now())).toUTCString()}: [ERROR (unhandledRejection)] ${reason}\n`);
  });
  process.on('exit', code => onExit(`${(new Date(Date.now())).toUTCString()}: [ERROR (exit)] Exiting with code ${code}\n`));

  function onExit(msg) {
    Logger.finalize();
    fs.writeFileSync(
      'data/Quasirandom/log.txt',
      msg,
      { flag: 'a' }
    );
    process.exitCode = 1;
  }

  client.on('message', msg => {
    if (msg.content === 'ping') {
      msg.reply('pong!');
    }
  });

  client.on('message', message => {
    msg = message.content.split(' ');
    switch (msg[0]) {
      case '!ram':
        repeatAfterMe(msg, message);
        break;
      case '!eval':
        evaluateString(msg, message);
        break;
    }
  });

  function repeatAfterMe(content, msg) {
    msg.channel.send(content.slice(1).join(' '));
  }

  function evaluateString(content, msg) {
    if (msg.member.id !== '669717327293710337') return;
    try {
      const cons = {
        log: arg => msg.channel.send(arg, {split: true})
      };
      const res = eval(`((console) => {${content.slice(1).join(' ').replace(/```([\s\S]+?)```/, '$1')}})`)(cons);
      if (res !== undefined) {
        cons.log(res);
      }
    } catch (e) {
      msg.channel.send('Error: ' + e.message, {split: true});
    }
  }

  client.on('error', err => Logger.error('[Client] ' + err, true));
}

init();
