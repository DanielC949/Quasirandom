const {
  discordClient: client,
  fs
} = require('./imports.js');

console.log('Logging in...');
client.login(fs.readFileSync('data/Quasirandom/token.txt', 'utf8').split('\r\n')[0]); //compensate for line ending

require('./serverready.js').prepare();

client.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('pong!');
  }
});

client.on('message', message => {
  msg = message.content.split(' ');
  if (msg.length <= 1 || msg[0] !== '!ram') return;
  message.channel.send(msg.slice(1).join(' '));
})

client.on('error', console.log);
