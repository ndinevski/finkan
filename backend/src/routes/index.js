import express from 'express';
import pg from 'pg';
import authRouter from './auth.js';
import { verifyToken, isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'finkan',
  ssl: false
});


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


testDatabaseConnection(pool);


pool.on('connect', () => {
  console.log('New client connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err);
});


router.post('/query', verifyToken, async (req, res) => {
  try {



    const { query, params } = req.body;
    const result = await pool.query(query, params);
    res.json({ rows: result.rows });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message });
  }
});


router.get('/profiles/:id', verifyToken, async (req, res) => {
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
    


    if (req.params.id !== req.user.id) {

      const publicProfile = {
        id: result.rows[0].id,
        full_name: result.rows[0].full_name,
        avatar_url: result.rows[0].avatar_url,

      };
      console.log('Returning public profile data');
      return res.json(publicProfile);
    }
    
    console.log('Profile found:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});


router.get('/workspaces/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM workspaces WHERE id = $1',
      [req.params.id]
    );
    
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    

    const memberCheck = await pool.query(
      'SELECT * FROM workspace_members WHERE workspace_id = $1 AND profile_id = $2',
      [req.params.id, req.user.id]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/workspaces/:id/members', verifyToken, async (req, res) => {
  try {

    const memberCheck = await pool.query(
      'SELECT * FROM workspace_members WHERE workspace_id = $1 AND profile_id = $2',
      [req.params.id, req.user.id]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      'SELECT * FROM workspace_members WHERE workspace_id = $1',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/projects/:id', verifyToken, async (req, res) => {
  try {

    const projectResult = await pool.query(
      'SELECT p.*, w.id as workspace_id FROM projects p JOIN workspaces w ON p.workspace_id = w.id WHERE p.id = $1',
      [req.params.id]
    );
    
    if (!projectResult.rows[0]) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const workspaceId = projectResult.rows[0].workspace_id;
    

    const memberCheck = await pool.query(
      'SELECT * FROM workspace_members WHERE workspace_id = $1 AND profile_id = $2',
      [workspaceId, req.user.id]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(projectResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/projects/:id/columns', verifyToken, async (req, res) => {
  try {

    const projectResult = await pool.query(
      'SELECT workspace_id FROM projects WHERE id = $1',
      [req.params.id]
    );
    
    if (!projectResult.rows[0]) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const workspaceId = projectResult.rows[0].workspace_id;
    

    const memberCheck = await pool.query(
      'SELECT * FROM workspace_members WHERE workspace_id = $1 AND profile_id = $2',
      [workspaceId, req.user.id]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      'SELECT * FROM columns WHERE project_id = $1 ORDER BY position',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/tasks/:id', verifyToken, async (req, res) => {
  try {

    const taskInfo = await pool.query(
      `SELECT t.*, c.project_id, p.workspace_id 
       FROM tasks t
       JOIN columns c ON t.column_id = c.id
       JOIN projects p ON c.project_id = p.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    
    if (!taskInfo.rows[0]) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const workspaceId = taskInfo.rows[0].workspace_id;
    

    const memberCheck = await pool.query(
      'SELECT * FROM workspace_members WHERE workspace_id = $1 AND profile_id = $2',
      [workspaceId, req.user.id]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(taskInfo.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/columns/:id/tasks', verifyToken, async (req, res) => {
  try {

    const columnInfo = await pool.query(
      `SELECT c.*, p.workspace_id 
       FROM columns c
       JOIN projects p ON c.project_id = p.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    
    if (!columnInfo.rows[0]) {
      return res.status(404).json({ error: 'Column not found' });
    }
    
    const workspaceId = columnInfo.rows[0].workspace_id;
    

    const memberCheck = await pool.query(
      'SELECT * FROM workspace_members WHERE workspace_id = $1 AND profile_id = $2',
      [workspaceId, req.user.id]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      'SELECT * FROM tasks WHERE column_id = $1 ORDER BY position',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.delete('/workspaces/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Get user ID from authenticated token

    console.log('Attempting to delete workspace:', { workspaceId: id, userId });


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


    await pool.query("DELETE FROM workspaces WHERE id = $1", [id]);

    res.json({ message: "Workspace deleted successfully" });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    res.status(500).json({ error: "Failed to delete workspace" });
  }
});


router.post('/workspaces', verifyToken, async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    const userId = req.user.id; // Get user ID from authenticated token
    const userEmail = req.user.email;

    console.log('Creating workspace:', { name, icon, description, userId, userEmail });


    const client = await pool.connect();
    try {
      await client.query('BEGIN');


      const userProfileCheck = await client.query(
        'SELECT * FROM profiles WHERE id = $1',
        [userId]
      );


      if (userProfileCheck.rows.length === 0) {
        console.log('User profile does not exist, creating it:', userId);
        await client.query(
          'INSERT INTO profiles (id, email, auth_provider) VALUES ($1, $2, $3)',
          [userId, userEmail, 'microsoft']
        );
      }


      const workspaceResult = await client.query(
        `INSERT INTO workspaces (name, icon, description, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [name, icon, description, userId]
      );
      const workspace = workspaceResult.rows[0];
      console.log('Created workspace:', workspace);      // Add creator as owner
      const memberResult = await client.query(
        `INSERT INTO workspace_members (workspace_id, profile_id, role)
         VALUES ($1, $2, 'owner')
         RETURNING *`,
        [workspace.id, userId]
      );
      console.log('Created workspace member:', memberResult.rows[0]);

      workspace.role = 'owner';
      
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


router.get('/workspaces', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from authenticated token
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


router.post('/tasks', verifyToken, async (req, res) => {
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
    const created_by = req.user.id; // Get user ID from authenticated token    console.log('Creating task with data:', req.body, 'by user:', created_by);


    if (!column_id || !title) {
      return res.status(400).json({ error: 'Missing required fields: column_id and title' });
    }
    

    const columnCheck = await client.query(
      `SELECT c.*, p.workspace_id 
       FROM columns c
       JOIN projects p ON c.project_id = p.id
       WHERE c.id = $1`,
      [column_id]
    );
    
    if (columnCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Column not found' });
    }
    

    const workspaceId = columnCheck.rows[0].workspace_id;
    const memberCheck = await client.query(
      'SELECT * FROM workspace_members WHERE workspace_id = $1 AND profile_id = $2',
      [workspaceId, created_by]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this column' });
    }

    await client.query('BEGIN');


    const positionResult = await client.query(
      'SELECT MAX(position) as max_position FROM tasks WHERE column_id = $1',
      [column_id]
    );
    const nextPosition = positionResult.rows[0].max_position !== null ? 
                        parseInt(positionResult.rows[0].max_position) + 1 : 0;
    console.log('Next position calculated:', nextPosition);


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
      description || null,
      assignee_id || null,
      priority || 'medium',
      status || 'todo',
      due_date || null,
      is_recurring === true,
      recurrence_pattern || null,
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


router.use('/auth', authRouter);

export default router;