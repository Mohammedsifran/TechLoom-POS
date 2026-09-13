const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runSchema() {
  console.log('Connecting to MySQL...');
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    multipleStatements: true // This allows running multiple queries at once
  });

  try {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    console.log(`Reading schema file from: ${schemaPath}`);
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema...');
    await connection.query(sql);
    console.log('✅ Database successfully reset and updated with new prices and columns!');
  } catch (error) {
    console.error('❌ Error executing schema:', error.message);
  } finally {
    await connection.end();
  }
}

runSchema();
