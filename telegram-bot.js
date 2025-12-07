const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Telegram bot token from environment variable
const token = process.env.TELEGRAM_BOT_TOKEN || '8207539465:AAEqIrY6QtzwTfEtZJ0iHbRevBLucJ_CMC0';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Telegram bot is running...');

// Listen for any kind of message
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  console.log(`Received message from ${msg.from.first_name}: ${messageText}`);

  // Echo the message back
  bot.sendMessage(chatId, `You said: ${messageText}`);
});

// Listen for /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name;

  bot.sendMessage(
    chatId,
    `👋 Welcome ${userName}! I'm your TeleBot assistant.\n\nAvailable commands:\n/start - Show this welcome message\n/help - Get help\n/products - View available products\n/orders - Check your orders`
  );
});

// Listen for /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    `🆘 *Help Menu*\n\nCommands:\n/start - Welcome message\n/help - Show this help menu\n/products - Browse products\n/orders - View your orders\n/contact - Contact support`,
    { parse_mode: 'Markdown' }
  );
});

// Listen for /products command
bot.onText(/\/products/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    `🛍️ *Available Products*\n\nBrowse our collection:\n• Toys 🧸\n• Stationery ✏️\n• Clothes 👕\n\nVisit our store to shop!`,
    { parse_mode: 'Markdown' }
  );
});

// Listen for /orders command
bot.onText(/\/orders/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    `📦 *Your Orders*\n\nTo check your orders, please login to your account on our website.\n\n🔗 [Visit HappyBuy Store](http://localhost:3001)`,
    { parse_mode: 'Markdown' }
  );
});

// Handle errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping Telegram bot...');
  bot.stopPolling();
  process.exit(0);
});
