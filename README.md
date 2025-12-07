# 🤖 TeleBot Admin Portal

A comprehensive admin dashboard for managing the TeleBot e-commerce system. This portal provides a simple and efficient interface for managing categories, products, users, and orders.

## 📋 Features

- **Admin Authentication**: Secure login and session management
- **Dashboard Analytics**: Real-time statistics and insights
- **Category Management**: Full CRUD operations for product categories
- **Product Management**: 
  - Create, read, update, and delete products
  - Image upload support
  - Stock management
  - Availability toggle
- **User Management**: View and manage registered users
- **Order Management**: 
  - View all orders with details
  - Update order status
  - Track order history
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd "c:\Year 3\FYP\telebot\admin-portal"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   Copy-Item .env.example .env
   ```

4. **Edit the `.env` file with your settings:**
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/telebot_admin
   SESSION_SECRET=your-secret-key-here
   DEFAULT_ADMIN_EMAIL=admin@telebot.com
   DEFAULT_ADMIN_PASSWORD=admin123
   ```

5. **Ensure MongoDB is running:**
   ```bash
   # Windows (if MongoDB is installed as a service)
   net start MongoDB
   ```

6. **Start the server:**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

7. **Access the portal:**
   - Open your browser and navigate to: `http://localhost:3000`
   - Login with default credentials:
     - Email: `admin@telebot.com`
     - Password: `admin123`

## 📁 Project Structure

```
admin-portal/
├── config/
│   └── database.js          # MongoDB connection
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── upload.js            # File upload configuration
├── models/
│   ├── Admin.js             # Admin user model
│   ├── Category.js          # Category model
│   ├── Product.js           # Product model
│   ├── User.js              # User model
│   └── Order.js             # Order model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── categories.js        # Category CRUD routes
│   ├── products.js          # Product CRUD routes
│   ├── users.js             # User management routes
│   ├── orders.js            # Order management routes
│   └── dashboard.js         # Dashboard analytics
├── public/
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
- Change the `PORT` in `.env` to a different value
- Or stop the process using the port

### Image Upload Issues
- Check that the `uploads` directory exists
- Ensure proper file permissions
- Verify file size limits (max 5MB)

## 🔄 Development

To run in development mode with auto-restart:
```bash
npm run dev
```

This uses nodemon to automatically restart the server when files change.

## 📦 Deployment

### Production Setup
1. Set `NODE_ENV=production` in your environment
2. Use a strong `SESSION_SECRET`
3. Change default admin credentials
4. Use a production MongoDB instance
5. Set up proper logging
6. Configure HTTPS
7. Set up reverse proxy (nginx/Apache)

### Recommended Production Configuration
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-production-db:27017/telebot_admin
SESSION_SECRET=your-very-secure-random-string
```

## 📄 License

This project is part of the TeleBot e-commerce system.

## 👨‍💻 Support

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
