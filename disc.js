const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let bot;
let responseBuffer = [];
let responseTimeout;

client.on('ready', () => {
  console.log(`🤖  Discord Bot ${client.user.tag} is online.`);
});

client.on('messageCreate', msg => {
  if (msg.channel.id === config.liveChatChannelId && !msg.author.bot) {
    handleLiveChat(msg);
  } else if (msg.content.startsWith(config.prefix)) {
    handleCommand(msg);
  }
});

function handleLiveChat(msg) {
  if (msg.content.trim() !== '' && !msg.content.startsWith('/msg')) {
    bot.chat(msg.content.replace(config.exe_cmd, '/'));
  }
}

function handleCommand(msg) {
  const args = msg.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  
  switch (command) {
    case 's':
      handleSCommand(args.join(' '), msg);
      break;
    case 'ftop':
      handleFtopCommand(msg);
      break;
  }
}

function handleSCommand(cmd, msg) {
  if (cmd.trim() !== '') {
    bot.chat(cmd.replace(config.exe_cmd, '/'));
    const responseHandler = response => {
      responseBuffer.push(response.toString());
      if (!responseTimeout) {
        responseTimeout = setTimeout(() => {
          if (responseBuffer.length > 0) {
            msg.channel.send(`\`\`\`${responseBuffer.join('\n')}\`\`\``);
            responseBuffer = [];
          }
          responseTimeout = null;
          bot.removeListener('message', responseHandler);
        }, 1000);
      }
    };
    bot.on('message', responseHandler);
  }
}

function handleFtopCommand(msg) {
  bot.chat('/f top');
  setTimeout(() => {
    const window = bot.currentWindow;
    if (window) {
      const message = parseFtopWindow(window);
      msg.channel.send(message);
      bot.closeWindow(window);
    } else {
      msg.channel.send('```✋  Bot is not in the right gamemode```');
    }
  }, 1000);
}

function parseFtopWindow(window) {
  let message = '```🏆Factions Top\n';
  for (let i = 10; i <= 45; i++) {
    const item = window.slots[i];
    if (item && item.nbt) {
      const nbtData = item.nbt.value;
      const displayName = JSON.parse(nbtData.display?.value?.Name?.value || '{}').extra?.map(e => e.text).join(' ') || '';
      const lore = nbtData.display?.value?.Lore?.value?.value.map(line => JSON.parse(line).extra?.map(e => e.text).join(' ') || '').filter(line => line);
      if (displayName && lore) {
        const factionName = extractFactionName(displayName);
        const place = extractPlace(lore);
        const worth = extractWorth(lore);
        if (factionName && place && worth) {
          message += `#${place} ${factionName} - ${worth}\n`;
        }
      }
    }
  }
  message += '```';
  return message;
}

function extractFactionName(displayName) {
  const factionMatch = displayName.match(/Faction (.+)/);
  return factionMatch ? factionMatch[1] : null;
}

function extractPlace(lore) {
  const placeLine = lore.find(line => line.includes('Place'));
  return placeLine ? placeLine.match(/#(\d+)/)[1] : null;
}

function extractWorth(lore) {
  const worthLine = lore.find(line => line.includes('Worth'));
  if (worthLine) {
    const worthMatch = worthLine.match(/\$(.+?) /);
    const worth = worthMatch ? worthMatch[1] : null;
    const unitMatch = worthLine.match(/\$.*? (.+)/);
    const unit = unitMatch ? unitMatch[1][0] : null;
    return worth && unit ? `${worth} ${unit}` : null;
  }
  return null;
}

function createClient(minecraftBot) {
  bot = minecraftBot;
  client.login(config.token);
  return client;
}

function setBot(minecraftBot) {
  bot = minecraftBot;
}

module.exports = { createClient, setBot, client };