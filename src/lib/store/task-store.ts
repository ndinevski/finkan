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
    dueDate?: string,
    assignee_id?: string | null,
    is_recurring?: boolean,
    recurrence_pattern?: string | null
  ) => Promise<void>;
  updateTaskStatus: (taskId: string, columnId: string, position: number) => Promise<void>;
  updateTaskDetails: (
    taskId: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'due_date' | 'assignee_id' | 'is_recurring' | 'recurrence_pattern'>>
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
  createTask: async (
    columnId,
    title,
    description,
    priority = 'medium',
    dueDate,
    assignee_id = null,
    is_recurring = false,
    recurrence_pattern = null
  ) => {
    const { data: { user } } = await auth.getSession();
    if (!user) throw new Error('Not authenticated');

    const lastTaskResult = await db.query<Task>(
      'SELECT position FROM tasks WHERE column_id = $1 ORDER BY position DESC LIMIT 1',
      [columnId]
    );
    const position = lastTaskResult.rows[0] ? lastTaskResult.rows[0].position + 1 : 0;

    const queryText = `
      INSERT INTO tasks (
        column_id, title, description, priority, due_date, position, created_by,
        assignee_id, is_recurring, recurrence_pattern
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    const queryParams = [
      columnId, title, description, priority, dueDate, position, user.id,
      assignee_id, is_recurring, recurrence_pattern
    ];

    await db.query(queryText, queryParams);
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
    const validUpdates = Object.entries(updates).filter(([, value]) => value !== undefined);
    if (validUpdates.length === 0) return;

    const setClause = validUpdates
      .map(([key], index) => `${key} = $${index + 2}`)
      .join(', ');
    const queryParams = [taskId, ...validUpdates.map(([, value]) => value)];

    await db.query(
      `UPDATE tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      queryParams
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
    const existingColumns = await db.query<Column>(
      'SELECT * FROM columns WHERE project_id = $1',
      [boardId]
    );

    if (existingColumns.rows.length > 0) {
      return;
    }

    await db.query('BEGIN');

    try {
      const insertedColumns: Column[] = [];
      for (const col of columns) {
        const result = await db.query<Column>(
          'INSERT INTO columns (project_id, name, position) VALUES ($1, $2, $3) RETURNING *',
          [boardId, col.name, col.position]
        );
        insertedColumns.push(result.rows[0]);
      }
      
      await db.query('COMMIT');
      
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
      const project_id = columns.find(c => c.id === columnId)?.project_id;
      if (project_id) {
        await get().fetchColumns(project_id);
      }
    }
  },
}));