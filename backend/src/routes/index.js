import express from 'express';
import pg from 'pg';

const router = express.Router();

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'finkan',
  ssl: false
});

// Create a function to test the database connection
async function testDatabaseConnection(pool) {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL');
    const result = await client.query('SELECT NOW()');
    console.log('Database time:', result.rows[0].now);
    client.release();
    return true;
  } catch (err) {
    console.error('Database connection error:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      error: err.message
    });
    return false;
  }
}

// Test connection immediately
testDatabaseConnection(pool);

// Log database connection events
pool.on('connect', () => {
  console.log('New client connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err);
});

// Generic query endpoint
router.post('/query', async (req, res) => {
  try {
    const { query, params } = req.body;
    const result = await pool.query(query, params);
    res.json({ rows: result.rows });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Profiles
router.get('/profiles/:id', async (req, res) => {
  try {
    console.log('Fetching profile with ID:', req.params.id);
    const result = await pool.query(
      'SELECT * FROM profiles WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows[0]) {
      console.log('Profile not found');
      return res.status(404).json({ error: 'Profile not found' });
    }
    console.log('Profile found:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Workspaces
router.get('/workspaces/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM workspaces WHERE id = $1',
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Workspace members
router.get('/workspaces/:id/members', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM workspace_members WHERE workspace_id = $1',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Projects
router.get('/projects/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Project columns
router.get('/projects/:id/columns', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM columns WHERE project_id = $1 ORDER BY position',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tasks
router.get('/tasks/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Column tasks
router.get('/columns/:id/tasks', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE column_id = $1 ORDER BY position',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 