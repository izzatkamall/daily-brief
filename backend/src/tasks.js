import express from 'express';

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['open', 'completed'];

/** Validate + normalize an incoming task payload. Returns { value } or { error }. */
function validateTask(body, { partial = false } = {}) {
  const out = {};

  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim() === '') {
      return { error: 'title is required' };
    }
    out.title = body.title.trim();
  }
  if (!partial || body.description !== undefined) {
    out.description = typeof body.description === 'string' ? body.description : '';
  }
  if (!partial || body.dueDate !== undefined) {
    if (body.dueDate === null || body.dueDate === undefined || body.dueDate === '') {
      out.dueDate = null;
    } else if (typeof body.dueDate === 'string' && !Number.isNaN(Date.parse(body.dueDate))) {
      out.dueDate = body.dueDate;
    } else {
      return { error: 'dueDate must be an ISO date string or null' };
    }
  }
  if (!partial || body.priority !== undefined) {
    const priority = body.priority ?? 'medium';
    if (!PRIORITIES.includes(priority)) {
      return { error: `priority must be one of ${PRIORITIES.join(', ')}` };
    }
    out.priority = priority;
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return { error: `status must be one of ${STATUSES.join(', ')}` };
    }
    out.status = body.status;
  }
  return { value: out };
}

export function makeTaskRouter(db) {
  const router = express.Router();

  const insert = db.prepare(`
    INSERT INTO tasks (title, description, dueDate, priority, status, createdAt, updatedAt)
    VALUES (@title, @description, @dueDate, @priority, @status, @createdAt, @updatedAt)
  `);
  const getById = db.prepare('SELECT * FROM tasks WHERE id = ?');

  // List with optional status + priority filters
  router.get('/', (req, res) => {
    const clauses = [];
    const params = {};
    if (req.query.status) {
      if (!STATUSES.includes(req.query.status)) {
        return res.status(400).json({ error: 'invalid status filter' });
      }
      clauses.push('status = @status');
      params.status = req.query.status;
    }
    if (req.query.priority) {
      if (!PRIORITIES.includes(req.query.priority)) {
        return res.status(400).json({ error: 'invalid priority filter' });
      }
      clauses.push('priority = @priority');
      params.priority = req.query.priority;
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = db
      .prepare(`SELECT * FROM tasks ${where} ORDER BY
        CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
        (dueDate IS NULL), dueDate ASC, createdAt DESC`)
      .all(params);
    res.json(rows);
  });

  router.get('/:id', (req, res) => {
    const task = getById.get(req.params.id);
    if (!task) return res.status(404).json({ error: 'not found' });
    res.json(task);
  });

  router.post('/', (req, res) => {
    const { value, error } = validateTask(req.body ?? {});
    if (error) return res.status(400).json({ error });
    const now = new Date().toISOString();
    const row = {
      title: value.title,
      description: value.description ?? '',
      dueDate: value.dueDate ?? null,
      priority: value.priority ?? 'medium',
      status: value.status ?? 'open',
      createdAt: now,
      updatedAt: now,
    };
    const info = insert.run(row);
    res.status(201).json(getById.get(info.lastInsertRowid));
  });

  router.put('/:id', (req, res) => {
    const existing = getById.get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'not found' });
    const { value, error } = validateTask(req.body ?? {}, { partial: true });
    if (error) return res.status(400).json({ error });
    const merged = { ...existing, ...value, updatedAt: new Date().toISOString() };
    db.prepare(`
      UPDATE tasks SET title=@title, description=@description, dueDate=@dueDate,
        priority=@priority, status=@status, updatedAt=@updatedAt WHERE id=@id
    `).run(merged);
    res.json(getById.get(req.params.id));
  });

  router.delete('/:id', (req, res) => {
    const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true });
  });

  return router;
}
