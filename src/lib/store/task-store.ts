import { create } from 'zustand';
import { db } from '../db/client';
import { Task, Column } from '../db/types';
import { auth } from '../auth/client';

interface TaskState {
  tasks: Task[];
  columns: Column[];
  isLoading: boolean;
  fetchTasks: (columnIds: string[]) => Promise<void>;
  fetchColumns: (boardId: string) => Promise<{ rows: Column[] }>;
  createTask: (
    columnId: string,
    title: string,
    description?: string,
    priority?: Task['priority'],
    dueDate?: string
  ) => Promise<void>;
  updateTaskStatus: (taskId: string, columnId: string, position: number) => Promise<void>;
  updateTaskDetails: (
    taskId: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'due_date'>>
  ) => Promise<void>;
  createColumn: (boardId: string, name: string, position: number) => Promise<void>;
  createDefaultColumns: (boardId: string, columns: { name: string; position: number }[]) => Promise<void>;
  updateColumnPosition: (columnId: string, position: number) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  columns: [],
  isLoading: false,
  fetchTasks: async (columnIds: string[]) => {
    set({ isLoading: true });
    const result = await db.query<Task>(
      'SELECT * FROM tasks WHERE column_id = ANY($1) ORDER BY position ASC',
      [columnIds]
    );
    set({ tasks: result.rows, isLoading: false });
  },
  fetchColumns: async (boardId: string) => {
    const result = await db.query<Column>(
      'SELECT * FROM columns WHERE project_id = $1 ORDER BY position ASC',
      [boardId]
    );
    set({ columns: result.rows });
    if (result.rows.length > 0) {
      await get().fetchTasks(result.rows.map((col) => col.id));
    }
    return result;
  },
  createTask: async (columnId, title, description, priority = 'medium', dueDate) => {
    const { data: { user } } = await auth.getSession();
    if (!user) throw new Error('Not authenticated');

    const lastTaskResult = await db.query<Task>(
      'SELECT position FROM tasks WHERE column_id = $1 ORDER BY position DESC LIMIT 1',
      [columnId]
    );
    const position = lastTaskResult.rows[0] ? lastTaskResult.rows[0].position + 1 : 0;

    await db.query(
      'INSERT INTO tasks (column_id, title, description, priority, due_date, position, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [columnId, title, description, priority, dueDate, position, user.id]
    );
    await get().fetchTasks([columnId]);
  },
  updateTaskStatus: async (taskId, columnId, position) => {
    await db.query(
      'UPDATE tasks SET column_id = $1, position = $2 WHERE id = $3',
      [columnId, position, taskId]
    );
    const columns = get().columns;
    await get().fetchTasks(columns.map((col) => col.id));
  },
  updateTaskDetails: async (taskId, updates) => {
    const setClause = Object.entries(updates)
      .map(([key, _], index) => `${key} = $${index + 2}`)
      .join(', ');
    await db.query(
      `UPDATE tasks SET ${setClause} WHERE id = $1`,
      [taskId, ...Object.values(updates)]
    );
    const task = get().tasks.find((t) => t.id === taskId);
    if (task) {
      await get().fetchTasks([task.column_id]);
    }
  },
  createColumn: async (boardId, name, position) => {
    const result = await db.query<Column>(
      'INSERT INTO columns (project_id, name, position) VALUES ($1, $2, $3) RETURNING *',
      [boardId, name, position]
    );
    set((state) => ({ 
      columns: [...state.columns, result.rows[0]].sort((a, b) => a.position - b.position)
    }));
  },
  createDefaultColumns: async (boardId, columns) => {
    // First, check if columns already exist
    const existingColumns = await db.query<Column>(
      'SELECT * FROM columns WHERE project_id = $1',
      [boardId]
    );

    if (existingColumns.rows.length > 0) {
      return; // Don't create columns if they already exist
    }

    // Use a transaction to ensure atomicity
    await db.query('BEGIN');

    try {
      // Insert columns one by one to ensure no duplicates
      const insertedColumns: Column[] = [];
      for (const col of columns) {
        const result = await db.query<Column>(
          'INSERT INTO columns (project_id, name, position) VALUES ($1, $2, $3) RETURNING *',
          [boardId, col.name, col.position]
        );
        insertedColumns.push(result.rows[0]);
      }
      
      await db.query('COMMIT');
      
      // Update the state with the new columns
      set({ columns: insertedColumns });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  },
  updateColumnPosition: async (columnId, position) => {
    await db.query(
      'UPDATE columns SET position = $1 WHERE id = $2',
      [position, columnId]
    );
    const columns = get().columns;
    if (columns.length > 0) {
      await get().fetchColumns(columns[0].project_id);
    }
  },
}));