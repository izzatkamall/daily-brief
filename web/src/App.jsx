import { useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken } from './api.js';
import Login from './components/Login.jsx';
import TaskForm from './components/TaskForm.jsx';
import TaskList from './components/TaskList.jsx';

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const [brief, setBrief] = useState(null);
  const [briefBusy, setBriefBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.listTasks({ status: statusFilter, priority: priorityFilter });
      setTasks(data);
      setError('');
    } catch (err) {
      if (err.message === 'Unauthorized') setAuthed(false);
      else setError(err.message);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  async function createTask(payload) {
    await api.createTask(payload);
    await load();
  }

  async function saveEdit(payload) {
    await api.updateTask(editing.id, payload);
    setEditing(null);
    await load();
  }

  async function toggle(task) {
    await api.updateTask(task.id, { status: task.status === 'completed' ? 'open' : 'completed' });
    await load();
  }

  async function remove(task) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    await api.deleteTask(task.id);
    if (editing?.id === task.id) setEditing(null);
    await load();
  }

  async function generateBrief() {
    setBriefBusy(true);
    try {
      const data = await api.brief();
      setBrief(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBriefBusy(false);
    }
  }

  function logout() {
    setToken(null);
    setAuthed(false);
    setTasks([]);
    setBrief(null);
  }

  if (!authed) return <Login onLoggedIn={() => setAuthed(true)} />;

  return (
    <div className="app">
      <header className="topbar">
        <h1>Daily Brief</h1>
        <button className="ghost" onClick={logout}>Log out</button>
      </header>

      <main className="layout">
        <section className="left">
          <TaskForm
            key={editing?.id ?? 'new'}
            task={editing}
            onSubmit={editing ? saveEdit : createTask}
            onCancel={() => setEditing(null)}
          />

          <div className="card brief">
            <div className="brief-head">
              <h2>AI Daily Brief</h2>
              <button onClick={generateBrief} disabled={briefBusy}>
                {briefBusy ? 'Generating…' : 'Generate'}
              </button>
            </div>
            {brief ? (
              <>
                <p className="brief-text">{brief.brief}</p>
                <p className="hint">
                  {brief.source === 'fallback' ? 'Generated locally (no AI key set)' : `via ${brief.source}`}
                  {' · '}
                  {new Date(brief.generatedAt).toLocaleString()}
                </p>
              </>
            ) : (
              <p className="muted">Click Generate for a summary of your open tasks.</p>
            )}
          </div>
        </section>

        <section className="right">
          <div className="filters card">
            <label>
              Status
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All</option>
                <option value="open">Open</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label>
              Priority
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                <option value="">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
          </div>

          {error && <p className="error">{error}</p>}
          <TaskList tasks={tasks} onToggle={toggle} onEdit={setEditing} onDelete={remove} />
        </section>
      </main>
    </div>
  );
}
