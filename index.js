const {
  discordClient: client,
  fs
} = require('./imports.js');

process.on('uncaughtException', (error, origin) => {
  Logger.error(e.name + ': ' + e.message);
  process.exitCode = 1;
})

console.log('Logging in...');
client.login(fs.readFileSync('data/Quasirandom/token', 'utf8'));

require('./serverready.js').prepare();

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

client.on('error', console.log);
