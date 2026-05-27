import cors from 'cors';
import express from 'express';
import { metricsContentType, metricsMiddleware, metricsResponse, taskStatusGauge } from './metrics.js';
import { pool, query } from './db.js';

const allowedStatuses = new Set(['queued', 'running', 'blocked', 'done']);
const allowedPriorities = new Set(['low', 'medium', 'high', 'critical']);

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
  app.use(express.json());
  app.use(metricsMiddleware);

  app.get('/healthz', async (_req, res) => {
    res.json({ status: 'ok', service: 'opspulse-api' });
  });

  app.get('/readyz', async (_req, res) => {
    await pool.query('SELECT 1');
    res.json({ status: 'ready', database: 'reachable' });
  });

  app.get('/metrics', async (_req, res) => {
    await refreshTaskMetrics();
    res.set('Content-Type', metricsContentType());
    res.end(await metricsResponse());
  });

  app.get('/api/summary', async (_req, res) => {
    const [tasks, incidents] = await Promise.all([
      query('SELECT status, COUNT(*)::int AS count FROM tasks GROUP BY status ORDER BY status'),
      query('SELECT status, COUNT(*)::int AS count FROM incidents GROUP BY status ORDER BY status')
    ]);

    res.json({
      tasks: tasks.rows,
      incidents: incidents.rows,
      generatedAt: new Date().toISOString()
    });
  });

  app.get('/api/tasks', async (_req, res) => {
    const result = await query(
      'SELECT id, title, owner, priority, status, created_at, updated_at FROM tasks ORDER BY id DESC LIMIT 50'
    );
    res.json(result.rows);
  });

  app.post('/api/tasks', async (req, res) => {
    const { title, owner, priority = 'medium' } = req.body;
    if (!title || !owner || !allowedPriorities.has(priority)) {
      return res.status(400).json({ error: 'title, owner, and a valid priority are required' });
    }

    const result = await query(
      'INSERT INTO tasks (title, owner, priority) VALUES ($1, $2, $3) RETURNING *',
      [title, owner, priority]
    );
    res.status(201).json(result.rows[0]);
  });

  app.patch('/api/tasks/:id/status', async (req, res) => {
    const { status } = req.body;
    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ error: 'valid status is required' });
    }

    const result = await query(
      'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'task not found' });
    }

    res.json(result.rows[0]);
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'internal server error' });
  });

  return app;
}

async function refreshTaskMetrics() {
  const result = await query('SELECT status, COUNT(*)::int AS count FROM tasks GROUP BY status');
  taskStatusGauge.reset();
  for (const row of result.rows) {
    taskStatusGauge.set({ status: row.status }, row.count);
  }
}
