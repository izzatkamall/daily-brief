import { useState, useEffect } from 'react';

const empty = { title: '', description: '', dueDate: '', priority: 'medium' };

/**
 * Create/edit form. When `task` is provided it edits that task; otherwise it
 * creates a new one. Calls onSubmit(payload) and onCancel().
 */
export default function TaskForm({ task, onSubmit, onCancel }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? '',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        priority: task.priority,
      });
    } else {
      setForm(empty);
    }
  }, [task]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    await onSubmit({
      title: form.title.trim(),
      description: form.description,
      dueDate: form.dueDate || null,
      priority: form.priority,
    });
    if (!task) setForm(empty);
  }

  return (
    <form className="card task-form" onSubmit={submit}>
      <h2>{task ? 'Edit task' : 'New task'}</h2>
      <label>
        Title
        <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="What needs doing?" />
      </label>
      <label>
        Description
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} />
      </label>
      <div className="row">
        <label>
          Due date
          <input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
        </label>
        <label>
          Priority
          <select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="row">
        <button type="submit">{task ? 'Save changes' : 'Add task'}</button>
        {task && <button type="button" className="ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
