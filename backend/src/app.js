import express from 'express';
import cors from 'cors';
import { makeAuth } from './auth.js';
import { makeTaskRouter } from './tasks.js';
import { generateBrief } from './ai.js';

/**
 * Build the Express app around a given db + config. Kept separate from server.js
 * so tests can spin up an in-memory instance without opening a port.
 */
export function createApp(db, config = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const { login, requireAuth } = makeAuth({
    username: config.username ?? 'admin',
    password: config.password ?? 'password',
  });

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.post('/api/login', login);

  // Everything below requires auth
  app.use('/api/tasks', requireAuth, makeTaskRouter(db));

  app.post('/api/brief', requireAuth, async (req, res) => {
    try {
      const tasks = db.prepare('SELECT * FROM tasks').all();
      const { brief, source } = await generateBrief(tasks, config.ai ?? {});
      res.json({ brief, source, generatedAt: new Date().toISOString() });
    } catch (err) {
      res.status(500).json({ error: 'failed to generate brief', detail: String(err) });
    }
  });

  return app;
}
