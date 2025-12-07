const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL...');
    
    // Connect without specifying a database first
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
    });
    
    console.log('✅ Connected to MySQL');
    
    const dbName = process.env.MYSQL_DATABASE || 'telebot';
    
    // Create database if it doesn't exist
    console.log(`🗄️  Creating database "${dbName}" if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Database "${dbName}" is ready`);
    
    // Select the database
    await connection.query(`USE ${dbName}`);
    console.log(`✅ Using database "${dbName}"`);
    
    // Read schema file (MySQL-specific version)
    const schemaPath = path.join(__dirname, 'db', 'schema-mysql.sql');
    console.log(`📖 Reading schema from ${schemaPath}...`);
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and filter empty statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => {
        // Remove single-line comments
        let cleaned = stmt.replace(/--.*$/gm, '').trim();
        // Remove multi-line comments
        cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '').trim();
        return cleaned;
      })
      .filter(stmt => stmt.length > 0);
    
    console.log(`🔄 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      try {
        const stmt = statements[i];
        // Log key operations
        if (stmt.includes('CREATE TABLE') || stmt.includes('INSERT INTO')) {
          const match = stmt.match(/(?:CREATE TABLE|INSERT INTO)\s+(\w+)/i);
          if (match) {
            console.log(`  [${i + 1}/${statements.length}] ${match[1]}`);
          }
        }
        await connection.query(stmt);
      } catch (err) {
        // Ignore "table already exists" errors
        if (!err.message.includes('already exists')) {
          console.error(`❌ Error executing statement ${i + 1}:`, err.message);
          throw err;
        } else {
          console.log(`  [${i + 1}/${statements.length}] Skipped (already exists)`);
        }
      }
    }
    
    console.log('\n✅ Database setup completed successfully!');
    console.log(`\n📊 Schema imported into database: ${dbName}`);
    console.log('🚀 You can now start the server with: npm start\n');
    
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    console.error('\n💡 Troubleshooting tips:');
    console.error('   1. Make sure MySQL is running');
    console.error('   2. Check your .env file has correct MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD');
    console.error('   3. Make sure the user has CREATE permission');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 MySQL connection closed');
    }
  }
}

// Run setup
setupDatabase();
