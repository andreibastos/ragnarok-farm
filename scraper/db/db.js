const { Pool } = require('pg');

const pool = new Pool({
  user: 'ragnarok',
  host: 'localhost',
  database: 'ragnarok_db',
  password: 'ragnarok',
  port: 5432,
});

module.exports = pool;
