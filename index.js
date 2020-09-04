const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Listening at http://localhost:${port}`));

//=======================================//

const {
  discordClient: client
} = require('./imports.js');

console.log('Logging in...');
client.login(process.env.BOT_TOKEN);

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
