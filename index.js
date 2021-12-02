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

client.on('error', console.log);

client.on('rateLimit', info => {
  console.log('TL: ' + info.timeout);
  console.log('Lim: ' + info.limit);
  console.log('Path: ' + info.path);
  console.log('Route: ' + info.route);
});
