const mysql = require('mysql2');
require('dotenv').config();

// MySQL connection
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'Xiaobai0409',
  database: process.env.MYSQL_DATABASE || 'telebot_fyp',
});

db.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection error:', err);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL');
});

module.exports = db;
