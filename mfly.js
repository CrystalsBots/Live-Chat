const mineflayer = require('mineflayer');
const config = require('./config.json');

let messageBuffer = [];
let bufferTimeout;
let bot;
let In = false;

function createBot(client) {
  bot = mineflayer.createBot({
    username: config.server.username,
    host: config.server.host,
    port: config.server.port,
    version: '1.18.2',
    hideErrors: true,
  });

  bot.on('login', () => login());
  bot.on('end', () => end(client));
  bot.on('kicked', kicked);
  bot.on('error', () => error(client));
  bot.on('message', msg => message(client, msg));

  return bot;
}

function login() {
  if (!In) {
    console.log(`🧛‍  ${bot.username} is Online`);
    In = true;
    bot.chat(`/login ${config.server.password}`);
    setInterval(() => bot.chat(config.servercmd), 120000);
  }
}

function end(client) {
  console.log(`🦇  ${bot.username} has disconnected! Reconnecting.`);
  In = false;
  setTimeout(() => createBot(client), 5000);
}

function kicked(reason) {
  console.log(`👢  ${bot.username} was kicked: ${reason}`);
}

function error() {
  console.log(`💻  ${bot.username} has encountered an error.`);
}

function message(client, jsonMsg) {
  const msg = jsonMsg.toString();
  if (msg.trim() !== '') {
    messageBuffer.push(msg);
    if (!bufferTimeout) {
      bufferTimeout = setTimeout(() => {
        if (messageBuffer.length > 0) {
          const channel = client.channels.cache.get(config.liveChatChannelId);
          if (channel) {
            channel.send(`\`\`\`${messageBuffer.join('\n')}\`\`\``);
          }
          messageBuffer = [];
        }
        bufferTimeout = null;
      }, 100);
    }
  }
}

module.exports = { createBot, bot };