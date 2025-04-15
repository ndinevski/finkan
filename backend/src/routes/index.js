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

// Delete workspace
router.delete('/workspaces/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = "00000000-0000-0000-0000-000000000001"; // TODO: Get from auth

    console.log('Attempting to delete workspace:', { workspaceId: id, userId });

    // Check if user is owner of the workspace
    const memberResult = await pool.query(
      `SELECT role FROM workspace_members 
       WHERE workspace_id = $1 AND profile_id = $2`,
      [id, userId]
    );

    console.log('Workspace member check result:', memberResult.rows);

    if (memberResult.rows.length === 0 || memberResult.rows[0].role !== "owner") {
      console.log('User is not authorized to delete workspace');
      return res.status(403).json({ error: "Not authorized to delete this workspace" });
    }

    // Delete workspace (cascade will handle related records)
    await pool.query("DELETE FROM workspaces WHERE id = $1", [id]);

    res.json({ message: "Workspace deleted successfully" });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    res.status(500).json({ error: "Failed to delete workspace" });
  }
});

// Create workspace
router.post('/workspaces', async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    const userId = "00000000-0000-0000-0000-000000000001"; // TODO: Get from auth

    console.log('Creating workspace:', { name, icon, description, userId });

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create workspace
      const workspaceResult = await client.query(
        `INSERT INTO workspaces (name, icon, description)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [name, icon, description]
      );
      const workspace = workspaceResult.rows[0];
      console.log('Created workspace:', workspace);

      // Add creator as owner
      const memberResult = await client.query(
        `INSERT INTO workspace_members (workspace_id, profile_id, role)
         VALUES ($1, $2, 'owner')
         RETURNING *`,
        [workspace.id, userId]
      );
      console.log('Created workspace member:', memberResult.rows[0]);

      await client.query('COMMIT');
      res.json(workspace);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in create workspace transaction:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating workspace:", error);
    res.status(500).json({ error: "Failed to create workspace" });
  }
});

// Get all workspaces for current user
router.get('/workspaces', async (req, res) => {
  try {
    const userId = "00000000-0000-0000-0000-000000000001"; // TODO: Get from auth
    const result = await pool.query(
      `SELECT w.*, wm.role 
       FROM workspaces w
       JOIN workspace_members wm ON w.id = wm.workspace_id
       WHERE wm.profile_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    res.status(500).json({ error: "Failed to fetch workspaces" });
  }
});

// Create Task
router.post('/tasks', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      column_id,
      title,
      description,
      assignee_id,
      priority,
      status,
      due_date,
      is_recurring,
      recurrence_pattern
    } = req.body;
    const created_by = "00000000-0000-0000-0000-000000000001"; // TODO: Get from auth

    console.log('Creating task with data:', req.body, 'by user:', created_by);

    // Validate required fields
    if (!column_id || !title) {
      return res.status(400).json({ error: 'Missing required fields: column_id and title' });
    }

    await client.query('BEGIN');

    // Get the highest current position in the column
    const positionResult = await client.query(
      'SELECT MAX(position) as max_position FROM tasks WHERE column_id = $1',
      [column_id]
    );
    const nextPosition = (positionResult.rows[0].max_position || 0) + 1;
    console.log('Next position calculated:', nextPosition);

    // Insert the new task
    const insertQuery = `
      INSERT INTO tasks (
        column_id, title, description, assignee_id, priority, status, 
        due_date, is_recurring, recurrence_pattern, position, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      column_id,
      title,
      description,
      assignee_id, // Can be null
      priority || 'medium',
      status || 'todo',
      due_date, // Can be null
      is_recurring || false,
      recurrence_pattern, // Can be null
      nextPosition,
      created_by
    ];

    console.log('Executing insert query with values:', values);
    const taskResult = await client.query(insertQuery, values);
    const newTask = taskResult.rows[0];

    await client.query('COMMIT');
    console.log('Task created successfully:', newTask);
    res.status(201).json(newTask);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task", details: error.message });
  } finally {
    client.release();
  }
});

export default router; 