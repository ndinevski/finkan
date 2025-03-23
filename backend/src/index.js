import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import router from './routes/index.js';

// Load environment variables before creating the pool
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'finkan',
  ssl: false
});

console.log('Attempting to connect to PostgreSQL with config:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  user: process.env.DB_USER,
  database: process.env.DB_NAME
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL');
    const result = await client.query('SELECT NOW()');
    console.log('Database time:', result.rows[0].now);
    client.release();
  } catch (err) {
    console.error('Database connection error:', err);
    if (err.code === '28P01') {
      console.error('Authentication failed. Please check your database credentials.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('Could not connect to PostgreSQL. Please check if the database is running.');
    }
  }
}

testConnection();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', router);

// Test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to FinKan API' });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
}); 