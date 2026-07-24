import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db.js';

let server;
let base;
let token;

async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

before(async () => {
  const db = createDb(':memory:');
  const app = createApp(db, { username: 'admin', password: 'password' });
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

after(() => server?.close());

test('login rejects bad credentials', async () => {
  const res = await api('/api/login', { method: 'POST', body: { username: 'x', password: 'y' }, auth: false });
  assert.equal(res.status, 401);
});

test('login returns a token', async () => {
  const res = await api('/api/login', { method: 'POST', body: { username: 'admin', password: 'password' }, auth: false });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  token = res.body.token;
});

test('tasks require auth', async () => {
  const res = await api('/api/tasks', { auth: false });
  assert.equal(res.status, 401);
});

test('create task', async () => {
  const res = await api('/api/tasks', {
    method: 'POST',
    body: { title: 'Write report', description: 'Q3 numbers', dueDate: '2026-07-25', priority: 'high' },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.title, 'Write report');
  assert.equal(res.body.status, 'open');
  assert.equal(res.body.priority, 'high');
});

test('create task validates title', async () => {
  const res = await api('/api/tasks', { method: 'POST', body: { title: '   ' } });
  assert.equal(res.status, 400);
});

test('create task validates priority', async () => {
  const res = await api('/api/tasks', { method: 'POST', body: { title: 'x', priority: 'urgent' } });
  assert.equal(res.status, 400);
});

test('list + filter by status and priority', async () => {
  await api('/api/tasks', { method: 'POST', body: { title: 'Low done', priority: 'low', status: 'completed' } });
  const all = await api('/api/tasks');
  assert.ok(all.body.length >= 2);

  const open = await api('/api/tasks?status=open');
  assert.ok(open.body.every((t) => t.status === 'open'));

  const high = await api('/api/tasks?priority=high');
  assert.ok(high.body.every((t) => t.priority === 'high'));
});

test('update (complete) a task', async () => {
  const created = await api('/api/tasks', { method: 'POST', body: { title: 'Finish me' } });
  const id = created.body.id;
  const updated = await api(`/api/tasks/${id}`, { method: 'PUT', body: { status: 'completed' } });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.status, 'completed');
});

test('delete a task', async () => {
  const created = await api('/api/tasks', { method: 'POST', body: { title: 'Delete me' } });
  const id = created.body.id;
  const del = await api(`/api/tasks/${id}`, { method: 'DELETE' });
  assert.equal(del.status, 200);
  const after = await api(`/api/tasks/${id}`);
  assert.equal(after.status, 404);
});

test('brief endpoint returns text', async () => {
  const res = await api('/api/brief', { method: 'POST' });
  assert.equal(res.status, 200);
  assert.ok(typeof res.body.brief === 'string' && res.body.brief.length > 0);
});
