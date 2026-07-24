function dueLabel(dueDate) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 86400000;
  const diff = Math.round((due - today) / dayMs);
  const text = due.toLocaleDateString();
  if (diff < 0) return { text: `Overdue · ${text}`, cls: 'overdue' };
  if (diff === 0) return { text: `Due today · ${text}`, cls: 'today' };
  return { text: `Due ${text}`, cls: '' };
}

export default function TaskList({ tasks, onToggle, onEdit, onDelete }) {
  if (tasks.length === 0) {
    return <p className="muted center-text">No tasks match this filter.</p>;
  }
  return (
    <ul className="task-list">
      {tasks.map((t) => {
        const due = dueLabel(t.dueDate);
        return (
          <li key={t.id} className={`task ${t.status === 'completed' ? 'done' : ''}`}>
            <input
              type="checkbox"
              checked={t.status === 'completed'}
              onChange={() => onToggle(t)}
              title="Mark complete"
            />
            <div className="task-body">
              <div className="task-title">
                <span>{t.title}</span>
                <span className={`badge ${t.priority}`}>{t.priority}</span>
              </div>
              {t.description && <p className="task-desc">{t.description}</p>}
              {due && <span className={`due ${due.cls}`}>{due.text}</span>}
            </div>
            <div className="task-actions">
              <button className="ghost" onClick={() => onEdit(t)}>Edit</button>
              <button className="ghost danger" onClick={() => onDelete(t)}>Delete</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
