const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const db = require('./database/db');

// Telegram bot token from environment variable
const token = process.env.TELEGRAM_BOT_TOKEN || '8207539465:AAEqIrY6QtzwTfEtZJ0iHbRevBLucJ_CMC0';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// In-memory cart storage (chat_id => {product_id: quantity})
const userCarts = {};

// User session data (chat_id => {step, data})
const userSessions = {};

console.log('🤖 TeleBot Shopping Assistant is running...');
console.log('🛍️ Features: Smart Shopping, AI Recommendations, Virtual Try-On');

// ==================== HELPER FUNCTIONS ====================

// Get or create user in database
async function getOrCreateUser(telegramUser) {
  const { id: telegram_id, first_name, username } = telegramUser;
  
  try {
    // Check if user exists
    const [users] = await db.query(
      'SELECT * FROM users WHERE telegram_id = ?',
      [telegram_id]
    );

    if (users.length > 0) {
      return users[0];
    }

    // Create new user
    const email = username ? `${username}@telegram.user` : `user${telegram_id}@telegram.user`;
    await db.query(
      'INSERT INTO users (name, email, telegram_id, role) VALUES (?, ?, ?, ?)',
      [first_name || 'User', email, telegram_id, 'user']
    );

    const [newUser] = await db.query(
      'SELECT * FROM users WHERE telegram_id = ?',
      [telegram_id]
    );

    return newUser[0];
  } catch (error) {
    console.error('Error getting/creating user:', error);
    return null;
  }
}

// Fetch categories from database
async function getCategories() {
  try {
    const [categories] = await db.query(
      'SELECT * FROM categories WHERE is_active = 1 ORDER BY name'
    );
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Fetch products by category
async function getProductsByCategory(categoryId = null) {
  try {
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_available = 1 AND p.stock > 0
    `;
    const params = [];

    if (categoryId) {
      query += ' AND p.category_id = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY p.name';

    const [products] = await db.query(query, params);
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// AI-powered emotion response
function getEmotionResponse(message) {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('sad') || lowerMsg.includes('down') || lowerMsg.includes('unhappy')) {
    return {
      message: "I'm sorry you're feeling down! 😊 How about browsing some cheerful items to brighten your day? Cute toys always help! 🧸✨",
      suggestion: 'toys'
    };
  }
  
  if (lowerMsg.includes('bored') || lowerMsg.includes('boring')) {
    return {
      message: "Feeling bored? 🎮 Let me show you some fun products that might spark joy! Check out our latest collection! ✨",
      suggestion: 'all'
    };
  }
  
  if (lowerMsg.includes('happy') || lowerMsg.includes('excited') || lowerMsg.includes('great')) {
    return {
      message: "That's wonderful! 🎉 Your positive energy deserves a treat! Let me show you our best products! 🌟",
      suggestion: 'popular'
    };
  }
  
  if (lowerMsg.includes('recommend') || lowerMsg.includes('suggest') || lowerMsg.includes('what should')) {
    return {
      message: "I'd love to help you find something perfect! 🎁 Let me show you our trending items and personalized picks! ⭐",
      suggestion: 'recommended'
    };
  }
  
  if (lowerMsg.includes('gift') || lowerMsg.includes('present') || lowerMsg.includes('birthday')) {
    return {
      message: "Looking for the perfect gift? 🎁 I have some great suggestions! Let's find something special! 💝",
      suggestion: 'gifts'
    };
  }
  
  if (lowerMsg.includes('cheap') || lowerMsg.includes('affordable') || lowerMsg.includes('budget')) {
    return {
      message: "Smart shopping! 💰 Let me show you our best value items without compromising quality! 🏷️",
      suggestion: 'budget'
    };
  }
  
  return null;
}

// ==================== COMMAND HANDLERS ====================

// /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await getOrCreateUser(msg.from);

  const welcomeMessage = `
🌟 *Welcome to HappyBuy!* 🌟

Hi ${msg.from.first_name}! I'm your AI shopping assistant! 🤖✨

*🛍️ What I can do for you:*
• Browse products by category
• Add items to cart
• Smart checkout (remembers your info!)
• AI-powered recommendations
• Order tracking
• Virtual try-on (coming soon!)

*🎯 Quick Start:*
/categories - Browse by category
/products - View all products
/cart - Check your cart
/orders - View your orders
/help - Full menu

💡 *Pro tip:* Just tell me what you're looking for, and I'll help you find it! Try saying "I'm looking for a gift" or "Show me something cute" 😊
  `;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `
🆘 *Help & Commands* 🆘

*🛒 Shopping:*
/categories - Browse categories
/products - View all products
/search [keyword] - Search products
/cart - View your cart
/checkout - Complete purchase

*📦 Orders:*
/orders - View your orders
/track [order_id] - Track order

*👤 Account:*
/profile - View your profile
/updateinfo - Update address/phone

*🎨 Features:*
/recommend - Get AI recommendations
/deals - View special offers
/tryon - Virtual try-on (upload photo)

*💬 Natural Chat:*
You can also chat naturally! Try:
• "I'm looking for a gift"
• "Show me something cute"
• "What's on sale?"
• "Recommend something"

Need help? Just ask! 😊
  `;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// /categories command
bot.onText(/\/categories/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const categories = await getCategories();

    if (categories.length === 0) {
      bot.sendMessage(chatId, '❌ No categories available at the moment.');
      return;
    }

    const keyboard = categories.map(cat => [{
      text: `${cat.icon || '📦'} ${cat.name}`,
      callback_data: `cat_${cat.id}`
    }]);

    keyboard.push([{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]);

    bot.sendMessage(
      chatId,
      '🗂️ *Product Categories*\n\nChoose a category to browse:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard
        }
      }
    );
  } catch (error) {
    console.error('Error in /categories:', error);
    bot.sendMessage(chatId, '❌ Error loading categories. Please try again.');
  }
});

// /products command
bot.onText(/\/products/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const products = await getProductsByCategory();

    if (products.length === 0) {
      bot.sendMessage(chatId, '❌ No products available at the moment.');
      return;
    }

    let message = '🛍️ *All Available Products*\n\n';
    
    products.slice(0, 10).forEach((product, index) => {
      message += `${index + 1}. *${product.name}*\n`;
      message += `   💰 $${parseFloat(product.price).toFixed(2)}\n`;
      message += `   📦 Stock: ${product.stock}\n`;
      message += `   🏷️ ${product.category_name || 'Uncategorized'}\n\n`;
    });

    if (products.length > 10) {
      message += `\n_... and ${products.length - 10} more products!_\n`;
    }

    message += '\n💡 Use /categories to browse by category';
    message += '\n💡 Tap product buttons below for details:';

    const keyboard = products.slice(0, 5).map(product => [{
      text: `${product.name} - $${parseFloat(product.price).toFixed(2)}`,
      callback_data: `prod_${product.id}`
    }]);

    keyboard.push([{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]);

    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    console.error('Error in /products:', error);
    bot.sendMessage(chatId, '❌ Error loading products. Please try again.');
  }
});

// /cart command
bot.onText(/\/cart/, async (msg) => {
  const chatId = msg.chat.id;

  const cart = userCarts[chatId] || {};
  const productIds = Object.keys(cart);

  if (productIds.length === 0) {
    bot.sendMessage(chatId, '🛒 Your cart is empty!\n\nUse /products to start shopping! 🛍️');
    return;
  }

  try {
    const [products] = await db.query(
      `SELECT * FROM products WHERE id IN (${productIds.join(',')})`
    );

    let message = '🛒 *Your Shopping Cart*\n\n';
    let total = 0;

    products.forEach((product) => {
      const quantity = cart[product.id];
      const subtotal = parseFloat(product.price) * quantity;
      total += subtotal;

      message += `📦 *${product.name}*\n`;
      message += `   Quantity: ${quantity}\n`;
      message += `   Price: $${parseFloat(product.price).toFixed(2)} each\n`;
      message += `   Subtotal: $${subtotal.toFixed(2)}\n\n`;
    });

    message += `\n💰 *Total: $${total.toFixed(2)}*\n\n`;
    message += '👇 Choose an action:';

    const keyboard = [
      [{ text: '✅ Checkout', callback_data: 'checkout' }],
      [{ text: '🗑️ Clear Cart', callback_data: 'clear_cart' }],
      [{ text: '➕ Add More Products', callback_data: 'main_menu' }]
    ];

    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    console.error('Error in /cart:', error);
    bot.sendMessage(chatId, '❌ Error loading cart. Please try again.');
  }
});

// /orders command
bot.onText(/\/orders/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await getOrCreateUser(msg.from);

  try {
    const [orders] = await db.query(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
      [user.id]
    );

    if (orders.length === 0) {
      bot.sendMessage(chatId, '📦 You haven\'t placed any orders yet.\n\nStart shopping with /products! 🛍️');
      return;
    }

    let message = '📦 *Your Orders*\n\n';

    orders.forEach((order, index) => {
      message += `*Order #${order.id}*\n`;
      message += `📅 Date: ${new Date(order.created_at).toLocaleDateString()}\n`;
      message += `💰 Total: $${parseFloat(order.total_amount).toFixed(2)}\n`;
      message += `📍 Status: ${order.status}\n`;
      message += `🏠 Address: ${order.address}\n\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in /orders:', error);
    bot.sendMessage(chatId, '❌ Error loading orders. Please try again.');
  }
});

// ==================== CALLBACK QUERY HANDLERS ====================

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  // Answer callback query to remove loading state
  bot.answerCallbackQuery(query.id);

  // Category selection
  if (data.startsWith('cat_')) {
    const categoryId = parseInt(data.replace('cat_', ''));
    const products = await getProductsByCategory(categoryId);

    if (products.length === 0) {
      bot.sendMessage(chatId, '❌ No products in this category.');
      return;
    }

    let message = `🛍️ *Products in ${products[0].category_name}*\n\n`;

    products.forEach((product, index) => {
      message += `${index + 1}. *${product.name}*\n`;
      message += `   💰 $${parseFloat(product.price).toFixed(2)}\n`;
      message += `   📦 Stock: ${product.stock}\n\n`;
    });

    const keyboard = products.map(product => [{
      text: `View: ${product.name}`,
      callback_data: `prod_${product.id}`
    }]);

    keyboard.push([{ text: '🔙 Back to Categories', callback_data: 'categories' }]);

    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  }

  // Product details
  if (data.startsWith('prod_')) {
    const productId = parseInt(data.replace('prod_', ''));
    
    try {
      const [products] = await db.query('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [productId]);
      
      if (products.length === 0) {
        bot.sendMessage(chatId, '❌ Product not found.');
        return;
      }

      const product = products[0];

      let message = `🛍️ *${product.name}*\n\n`;
      message += `${product.description || 'No description available.'}\n\n`;
      message += `💰 *Price:* $${parseFloat(product.price).toFixed(2)}\n`;
      message += `📦 *Stock:* ${product.stock} available\n`;
      message += `🏷️ *Category:* ${product.category_name || 'Uncategorized'}\n`;

      const keyboard = [
        [
          { text: '➕ Add 1 to Cart', callback_data: `add_${productId}_1` },
          { text: '➕ Add 2 to Cart', callback_data: `add_${productId}_2` }
        ],
        [
          { text: '➕ Add 3 to Cart', callback_data: `add_${productId}_3` },
          { text: '➕ Add 5 to Cart', callback_data: `add_${productId}_5` }
        ],
        [
          { text: '🛒 View Cart', callback_data: 'view_cart' }
        ],
        [
          { text: '🔙 Back to Products', callback_data: 'products' }
        ]
      ];

      bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard
        }
      });

      // Send product image if available
      if (product.image_url && product.image_url.startsWith('http')) {
        try {
          bot.sendPhoto(chatId, product.image_url, {
            caption: `📸 ${product.name}`
          });
        } catch (error) {
          console.log('Could not send product image');
        }
      }
    } catch (error) {
      console.error('Error showing product:', error);
      bot.sendMessage(chatId, '❌ Error loading product details.');
    }
  }

  // Add to cart
  if (data.startsWith('add_')) {
    const parts = data.split('_');
    const productId = parseInt(parts[1]);
    const quantity = parseInt(parts[2]);

    if (!userCarts[chatId]) {
      userCarts[chatId] = {};
    }

    if (userCarts[chatId][productId]) {
      userCarts[chatId][productId] += quantity;
    } else {
      userCarts[chatId][productId] = quantity;
    }

    bot.sendMessage(chatId, `✅ Added ${quantity} item(s) to cart!\n\n🛒 Use /cart to view your cart and checkout.`);
  }

  // View cart
  if (data === 'view_cart') {
    bot.sendMessage(chatId, '🛒 Loading your cart...');
    setTimeout(() => {
      bot.sendMessage(chatId, '/cart').catch(() => {});
    }, 500);
  }

  // Clear cart
  if (data === 'clear_cart') {
    userCarts[chatId] = {};
    bot.sendMessage(chatId, '🗑️ Cart cleared successfully!');
  }

  // Checkout
  if (data === 'checkout') {
    const cart = userCarts[chatId] || {};
    const productIds = Object.keys(cart);

    if (productIds.length === 0) {
      bot.sendMessage(chatId, '🛒 Your cart is empty!');
      return;
    }

    const user = await getOrCreateUser(query.from);

    // Check if user has saved info
    if (!user.name || !user.phone_number) {
      userSessions[chatId] = { step: 'collect_name', cart };
      bot.sendMessage(chatId, '📝 To complete your order, I need some information.\n\n👤 Please enter your full name:');
      return;
    }

    // Process checkout with saved info
    await processCheckout(chatId, user, cart);
  }

  // Navigation callbacks
  if (data === 'main_menu') {
    bot.sendMessage(chatId, 'Choose an option:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🗂️ Categories', callback_data: 'categories' }],
          [{ text: '🛍️ All Products', callback_data: 'products' }],
          [{ text: '🛒 My Cart', callback_data: 'view_cart' }],
          [{ text: '📦 My Orders', callback_data: 'my_orders' }]
        ]
      }
    });
  }

  if (data === 'categories') {
    setTimeout(() => {
      bot.sendMessage(chatId, '/categories').catch(() => {});
    }, 200);
  }

  if (data === 'products') {
    setTimeout(() => {
      bot.sendMessage(chatId, '/products').catch(() => {});
    }, 200);
  }

  if (data === 'my_orders') {
    setTimeout(() => {
      bot.sendMessage(chatId, '/orders').catch(() => {});
    }, 200);
  }
});

// ==================== CHECKOUT PROCESS ====================

async function processCheckout(chatId, user, cart) {
  try {
    const productIds = Object.keys(cart);
    const [products] = await db.query(
      `SELECT * FROM products WHERE id IN (${productIds.join(',')})`
    );

    let total = 0;
    products.forEach((product) => {
      const quantity = cart[product.id];
      total += parseFloat(product.price) * quantity;
    });

    // Create order
    const [orderResult] = await db.query(
      `INSERT INTO orders (user_id, full_name, email, address, phone_number, payment_method, status, total_amount) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.name,
        user.email,
        user.address || 'Not provided',
        user.phone_number || 'Not provided',
        'Telegram',
        'pending',
        total
      ]
    );

    const orderId = orderResult.insertId;

    // Create order items
    for (const product of products) {
      const quantity = cart[product.id];
      await db.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity) 
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, product.id, product.name, product.price, quantity]
      );

      // Update stock
      await db.query(
        `UPDATE products SET stock = stock - ? WHERE id = ?`,
        [quantity, product.id]
      );
    }

    // Clear cart
    userCarts[chatId] = {};

    let message = `✅ *Order Confirmed!*\n\n`;
    message += `📋 Order ID: #${orderId}\n`;
    message += `💰 Total: $${total.toFixed(2)}\n`;
    message += `📍 Delivery to: ${user.address || 'Please update your address'}\n`;
    message += `📞 Contact: ${user.phone_number || 'Please update your phone'}\n\n`;
    message += `🚚 Your order is being processed!\n`;
    message += `We'll notify you of updates.\n\n`;
    message += `Thank you for shopping with HappyBuy! 🎉`;

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error processing checkout:', error);
    bot.sendMessage(chatId, '❌ Error processing order. Please try again or contact support.');
  }
}

// ==================== MESSAGE HANDLERS (AI & Natural Language) ====================

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Skip if it's a command
  if (text && text.startsWith('/')) {
    return;
  }

  // Handle checkout flow
  if (userSessions[chatId]) {
    const session = userSessions[chatId];
    
    if (session.step === 'collect_name') {
      session.name = text;
      session.step = 'collect_phone';
      bot.sendMessage(chatId, '📞 Great! Now please enter your phone number:');
      return;
    }

    if (session.step === 'collect_phone') {
      session.phone = text;
      session.step = 'collect_address';
      bot.sendMessage(chatId, '🏠 Perfect! Please enter your delivery address:');
      return;
    }

    if (session.step === 'collect_address') {
      session.address = text;
      
      // Update user info in database
      const user = await getOrCreateUser(msg.from);
      await db.query(
        'UPDATE users SET name = ?, phone_number = ?, address = ? WHERE id = ?',
        [session.name, session.phone, session.address, user.id]
      );

      bot.sendMessage(chatId, '✅ Information saved! Processing your order...');

      // Get updated user
      const [updatedUser] = await db.query('SELECT * FROM users WHERE id = ?', [user.id]);
      
      // Process checkout
      await processCheckout(chatId, updatedUser[0], session.cart);
      
      // Clear session
      delete userSessions[chatId];
      return;
    }
  }

  // AI Emotion & Intent Recognition
  if (text) {
    const emotionResponse = getEmotionResponse(text);
    
    if (emotionResponse) {
      bot.sendMessage(chatId, emotionResponse.message);
      
      // Show relevant products
      setTimeout(async () => {
        const products = await getProductsByCategory();
        if (products.length > 0) {
          const keyboard = products.slice(0, 5).map(product => [{
            text: `${product.name} - $${parseFloat(product.price).toFixed(2)}`,
            callback_data: `prod_${product.id}`
          }]);

          bot.sendMessage(chatId, '✨ Check these out:', {
            reply_markup: {
              inline_keyboard: keyboard
            }
          });
        }
      }, 1000);
      
      return;
    }

    // Smart search
    if (text.toLowerCase().includes('looking for') || 
        text.toLowerCase().includes('find') || 
        text.toLowerCase().includes('search') ||
        text.toLowerCase().includes('want')) {
      
      bot.sendMessage(chatId, `🔍 Searching for "${text}"...\n\nLet me show you what we have! 🛍️`);
      
      setTimeout(() => {
        bot.sendMessage(chatId, '/products').catch(() => {});
      }, 1000);
      
      return;
    }

    // Default helpful response
    bot.sendMessage(
      chatId, 
      `I'm here to help! 😊\n\n` +
      `💬 Try saying:\n` +
      `• "Show me products"\n` +
      `• "I'm looking for a gift"\n` +
      `• "What's on sale?"\n` +
      `• "Recommend something"\n\n` +
      `Or use /help to see all commands! 🚀`
    );
  }
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
