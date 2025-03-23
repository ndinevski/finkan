import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

// API routes
app.post('/api/query', async (req, res) => {
  const { query, params } = req.body;
  try {
    const result = await pool.query(query, params);
    res.json({ rows: result.rows });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Workspace routes
app.get('/api/workspaces', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM workspaces WHERE is_archived = false ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/workspaces', async (req, res) => {
  const { name, icon, description, userId } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO workspaces (name, icon, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, icon, description, userId]
    );
    
    // Add creator as a workspace member with 'owner' role
    await pool.query(
      'INSERT INTO workspace_members (workspace_id, profile_id, role) VALUES ($1, $2, $3)',
      [result.rows[0].id, userId, 'owner']
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/workspaces/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM workspaces WHERE id = $1',
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/workspaces/:id/members', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT wm.*, p.id as profile_id, p.email, p.full_name, p.avatar_url, p.role as profile_role, p.created_at as profile_created_at, p.updated_at as profile_updated_at
       FROM workspace_members wm 
       JOIN profiles p ON wm.profile_id = p.id 
       WHERE wm.workspace_id = $1`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching workspace members:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/workspaces/:id/members', async (req, res) => {
  const { email, role = 'member' } = req.body;
  const workspaceId = req.params.id;

  try {
    // First, find the user by email
    const userResult = await pool.query(
      'SELECT id FROM profiles WHERE email = $1',
      [email]
    );

    if (!userResult.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add user to workspace members
    const result = await pool.query(
      'INSERT INTO workspace_members (workspace_id, profile_id, role) VALUES ($1, $2, $3) RETURNING *',
      [workspaceId, userResult.rows[0].id, role]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding workspace member:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Project routes
app.get('/api/workspaces/:id/projects', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE workspace_id = $1 AND is_archived = false ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/workspaces/:id/projects', async (req, res) => {
  const { name, description, userId } = req.body;
  const workspaceId = req.params.id;

  try {
    const result = await pool.query(
      'INSERT INTO projects (workspace_id, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [workspaceId, name, description, userId]
    );

    // Create default columns: Todo, In Progress, Done
    const columns = ['Todo', 'In Progress', 'Done'];
    for (let i = 0; i < columns.length; i++) {
      await pool.query(
        'INSERT INTO columns (project_id, name, position) VALUES ($1, $2, $3)',
        [result.rows[0].id, columns[i], i]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/projects/:id/columns', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM columns WHERE project_id = $1 ORDER BY position',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Column routes
app.get('/api/columns/:id/tasks', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE column_id = $1 ORDER BY position',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 