const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: 'mysql-377d6458-mohamedsifran22-1f61.a.aivencloud.com',
  port: 25384,
  user: 'avnadmin',
  password: 'AVNS_3T9_' + 'lkOhQKCmQQFLc9V',
  database: 'defaultdb',
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
