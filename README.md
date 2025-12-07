# 🤖 TeleBot E-Commerce System

A comprehensive e-commerce platform featuring an admin dashboard and intelligent Telegram shopping bot with AI-powered recommendations and seamless database integration.

## 🌟 Key Features

### 🎯 Admin Portal
- **Dashboard Analytics**: Real-time revenue, order status, and product metrics
- **Category Management**: Full CRUD operations with icons and descriptions
- **Product Management**: 
  - Create, read, update, and delete products
  - Image upload support
  - Real-time stock management
  - Availability toggle
- **User Management**: View and manage customers with Telegram integration
- **Order Management**: 
  - View all orders with customer details
  - Update order status (pending → processing → delivered)
  - Track order history
  - Order items breakdown
- **Discount System**: Create and manage promotional codes
- **Responsive Design**: Works seamlessly on desktop and mobile

### 🤖 Telegram Shopping Bot (`t.me/nauxgniy_bot`)
- **Smart Shopping Interface**: Browse products directly in Telegram
- **AI Emotion Detection**: Responds to user mood with appropriate suggestions
- **Shopping Cart**: Add items, view cart, seamless checkout
- **Auto-Save User Info**: Remembers name, address, phone for instant repeat orders
- **Natural Language**: Understands "show me gifts", "I'm sad", etc.
- **Real-time Database Sync**: All orders appear instantly in admin portal
- **Order Tracking**: View purchase history in chat

## 🚀 Quick Start

### Prerequisites

- Node.js (v20 or higher)
- MySQL (v8.0 or higher)
- PM2 (for production deployment)
- Telegram Bot Token (from @BotFather)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YingXuan-RP/yx.git
   cd yx
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Edit the `.env` file with your settings:**
   ```env
   PORT=3001
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password_here
   MYSQL_DATABASE=yx
   SESSION_SECRET=your-secret-key-change-this
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   ```

5. **Set up the MySQL database:**
   - Create database: `CREATE DATABASE yx;`
   - Import initial data: Execute `db/telebot.sql` in MySQL Workbench
   - Run migration: Execute `db/migrate-to-admin.sql` to add admin portal features

6. **Start with PM2 (Recommended for Production):**
   ```bash
   npm install -g pm2
   npm run pm2:start
   ```

   Or manually:
   ```bash
   npm start              # Admin portal
   npm run bot            # Telegram bot
   ```

7. **Access the system:**
   - **Admin Portal**: http://localhost:3001/dashboard
   - **Telegram Bot**: https://t.me/nauxgniy_bot
   - Login with: `boss@happybuy.com` or `admins@gmail.com`

## 📁 Project Structure

```
telebot/
├── database/
│   └── db.js                # MySQL connection pool
├── db/
│   ├── telebot.sql          # Initial database structure
│   └── migrate-to-admin.sql # Admin portal migration
├── public/
│   ├── css/                 # Stylesheets
│   ├── js/                  # Client-side JavaScript
│   └── images/              # Static images
├── views/
│   ├── dashboard.html       # Admin dashboard
│   ├── categories.html      # Category management
│   ├── products.html        # Product management
│   ├── orders.html          # Order management
│   └── login.html           # Authentication
├── server.js                # Main Express server
├── telegram-bot.js          # Telegram bot with AI features
├── ecosystem.config.js      # PM2 configuration
├── .env                     # Environment variables
└── package.json             # Dependencies
│   ├── css/
│   │   └── style.css        # Main stylesheet
│   ├── js/
│   │   ├── common.js        # Shared utilities
│   │   ├── login.js         # Login functionality
│   │   ├── dashboard.js     # Dashboard logic
│   │   ├── categories.js    # Category management
│   │   ├── products.js      # Product management
│   │   ├── users.js         # User management
│   │   └── orders.js        # Order management
│   ├── login.html
│   ├── dashboard.html
│   ├── categories.html
│   ├── products.html
│   ├── users.html
│   └── orders.html
├── uploads/                  # Product images directory
├── .env                      # Environment variables
├── .gitignore
├── package.json
├── server.js                 # Main server file
└── README.md
```

## 🔐 Security

- **Session-based authentication** with secure cookie storage
- **Password hashing** using bcryptjs
- **Protected routes** requiring authentication
- **File upload validation** for product images

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/check` - Check session status

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (with image upload)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PATCH /api/products/:id/toggle-availability` - Toggle availability

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `DELETE /api/users/:id` - Delete user

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get single order
- `PATCH /api/orders/:id/status` - Update order status

### Dashboard
- `GET /api/dashboard/analytics` - Get dashboard analytics

## 🛠️ Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: express-session, bcryptjs
- **File Upload**: Multer
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Environment**: dotenv

## 🎨 Design Features

- Modern, clean interface
- Responsive design for all screen sizes
- Intuitive navigation
- Real-time data updates
- Toast notifications for user feedback
- Modal dialogs for forms
- Status badges and indicators
- Professional color scheme

## 🔧 Configuration Options

### Environment Variables

- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - MongoDB connection string
- `SESSION_SECRET` - Secret key for session encryption
- `DEFAULT_ADMIN_EMAIL` - Default admin email
- `DEFAULT_ADMIN_PASSWORD` - Default admin password

## 📝 Usage Guide

### Managing Categories
1. Navigate to the Categories page
2. Click "Add Category" to create a new category
3. Fill in the name, description, and icon
4. Toggle active status as needed
5. Edit or delete existing categories

### Managing Products
1. Navigate to the Products page
2. Click "Add Product" to create a new product
3. Fill in all required fields (name, description, price, category)
4. Upload a product image (optional)
5. Set stock levels and availability
6. Use the toggle to enable/disable products quickly

### Managing Users
1. Navigate to the Users page
2. View all registered Telegram bot users
3. Click "View" to see detailed user information
4. Delete users if necessary

### Managing Orders
1. Navigate to the Orders page
2. View all orders with status indicators
3. Click "View Details" to see full order information
4. Update order status from the details modal

## 🚨 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `net start MongoDB`
- Check the connection string in `.env`
- Verify MongoDB is accessible on the specified port

### Port Already in Use
```bash
# Kill process on port 3001
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process
```

### Database Connection Issues
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database `yx` exists
- Run migration scripts

## 🤖 Telegram Bot Features

See [TELEGRAM_BOT_FEATURES.md](TELEGRAM_BOT_FEATURES.md) for complete documentation.

**Key Capabilities:**
- 🛍️ Smart shopping interface with inline keyboards
- 🤖 AI emotion detection and personalized responses
- 🧺 Shopping cart with instant checkout
- 💾 Auto-saves user information (no repeated forms!)
- 📦 Order tracking and history
- 🔄 Real-time database synchronization with admin portal

**Try it:** https://t.me/nauxgniy_bot

## 📊 Database Schema

**Main Tables:**
- `users` - Customer accounts with telegram_id
- `categories` - Product categories with icons
- `products` - Inventory with stock tracking
- `orders` - Customer orders with status
- `order_items` - Order line items
- `discounts` - Promotional codes

## 🎓 FYP Highlights

This project demonstrates:
- ✅ Full-stack web application (Node.js + MySQL)
- ✅ Telegram Bot API integration
- ✅ AI/ML features (NLP, emotion detection)
- ✅ Real-time data synchronization
- ✅ RESTful API design
- ✅ Session management and authentication
- ✅ Process management with PM2
- ✅ Git version control

## 📦 PM2 Commands

```bash
pm2 status                    # Check status
pm2 logs                      # View all logs
pm2 logs telebot-admin        # Admin portal logs
pm2 logs telebot-telegram     # Bot logs
pm2 restart all               # Restart all
pm2 stop all                  # Stop all
pm2 delete all                # Remove all
```

## 📄 License

Educational project for FYP - Republic Polytechnic

## 👨‍💻 Developer

**YingXuan**  
GitHub: [@YingXuan-RP](https://github.com/YingXuan-RP)  
Bot: https://t.me/nauxgniy_bot

## 🙏 Acknowledgments

- Node.js & Express.js
- MySQL Database
- Telegram Bot API
- PM2 Process Manager

For issues or questions, please contact the development team.

## 🎯 Future Enhancements

- Multi-admin support with roles
- Export data to CSV/Excel
- Advanced analytics and reporting
- Email notifications
- Product variants
- Inventory tracking
- Discount management
- Customer reviews management

---

**Built with ❤️ for efficient e-commerce management**
