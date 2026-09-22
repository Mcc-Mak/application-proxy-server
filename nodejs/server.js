const express = require('express');
const mysql   = require('mysql2/promise');

const app  = express();
const PORT = 3000;

app.use(express.json());

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT || 3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

app.get('/api/health', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', db: rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.get('/api/items', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM items');
  res.json(rows);
});

app.listen(PORT, () => console.log(`API listening on :${PORT}`));
