const mfly = require('./mfly');
const disc = require('./disc');

const client = disc.createClient();

client.once('ready', () => {
  const bot = mfly.createBot(client);
  disc.setBot(bot);
});