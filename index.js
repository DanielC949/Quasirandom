const client = require('./client.js');
const fs = require('fs');
const builder = require('@discordjs/builders');

async function init() {
  client.commandHeaders = [];
  client.commands = new Map();
  await bindGlobalCommands();
  await require('./serverready.js').prepare();
  const Logger = require('./logger.js');
  await initProcess(Logger);
  await initClient(Logger);
}

async function initProcess(Logger) {
  process.on('uncaughtException', (error, origin) => {
    onExit(`${(new Date(Date.now())).toUTCString()}: [ERROR] [PROCESS] Unhandled exception in ${origin}: ${error}\n`);
  });
  process.on('unhandledRejection', (reason, promise) => {
    onExit(`${(new Date(Date.now())).toUTCString()}: [ERROR] [PROCESS] Unhandled rejection from ${promise}: ${reason}\n`);
  });
  process.on('exit', code => onExit(`${(new Date(Date.now())).toUTCString()}: [ERROR] [PROCESS] Exiting with code ${code}\n`));

  function onExit(msg) {
    Logger.finalize();
    fs.writeFileSync(
      'data/Quasirandom/log.txt',
      msg,
      { flag: 'a' }
    );
    process.exitCode = 1;
  }
}

async function bindGlobalCommands() {
  client.commandHeaders.push(new builder.SlashCommandBuilder().setName('ping').setDescription('Replies with pong!').toJSON());
  client.commands.set('ping', async interaction => interaction.reply('pong!'));

  client.commandHeaders.push(
    new builder.SlashCommandBuilder()
    .setName('echo')
    .setDescription('Repeats the supplied message')
    .addStringOption(option =>
      option.setName('message')
      .setDescription('The message to repeat')
      .setRequired(true)
    )
    .toJSON()
  );
  client.commands.set('echo', async interaction => {
    interaction.reply(interaction.options.getString('message'));
  });

  client.commandHeaders.push(
    new builder.SlashCommandBuilder()
    .setName('eval')
    .setDescription('Evaluates the message as JavaScript')
    .addStringOption(option =>
      option.setName('code')
      .setDescription('The code to evaluate')
      .setRequired(true)
    )
    .toJSON()
  );
  client.commands.set('eval', async interaction => {
    const { owner_id } = require('./constants.js');
    if (interaction.user.id !== owner_id) {
      interaction.reply({
        content: 'You do not have the permissions to use this command',
        ephemeral: true
      });
      return;
    }

    output = [];
    try {
      const cons = {
        log: arg => output.push(arg)
      };
      const res = eval(`((console) => {${interaction.options.getString('code').replace(/^(`{3}|`(?!`))(.*)(?:\1)$/, '$1')}})`)(cons);
      if (res !== undefined) {
        cons.log(res);
      }

      interaction.reply(output.join('\n'));
    } catch (e) {
      interaction.reply('Error: ' + e.message);
    }
  });
}

async function initClient(Logger) {
  client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    let f = client.commands.get(interaction.commandName);
    if (f !== undefined) {
      try {
        await f(interaction);
      } catch (e) {
        Logger.error(`[COMMAND] [${interaction.commandName}] Uncaught exception: ${e.message}`);
      }
    }
  })

  client.on('error', err => Logger.error('[CLIENT] ' + err, true));
}

init();
