/**
 * Daily Brief generation.
 *
 * Strategy: build a compact, deterministic description of the open tasks, then
 * ask an LLM to turn it into a short natural-language brief. If no provider/key
 * is configured (or the call fails) we fall back to a deterministic locally
 * generated brief so the feature always works. The real provider wiring is
 * fleshed out in Phase 3.
 */

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Categorize open tasks relative to today. */
export function analyzeTasks(tasks) {
  const open = tasks.filter((t) => t.status === 'open');
  const today = startOfToday();
  const overdue = [];
  const dueToday = [];
  const upcoming = [];

  for (const t of open) {
    if (!t.dueDate) {
      upcoming.push(t);
      continue;
    }
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    if (due < today) overdue.push(t);
    else if (due.getTime() === today.getTime()) dueToday.push(t);
    else upcoming.push(t);
  }

  const rank = { high: 0, medium: 1, low: 2 };
  const byPriority = [...open].sort((a, b) => rank[a.priority] - rank[b.priority]);
  return { open, overdue, dueToday, upcoming, byPriority };
}

/** Deterministic, no-LLM fallback brief. */
export function fallbackBrief(tasks) {
  const { open, overdue, dueToday, byPriority } = analyzeTasks(tasks);
  if (open.length === 0) {
    return 'You have no open tasks. Nice — inbox zero. Enjoy the clear runway.';
  }
  const parts = [];
  parts.push(`You have ${open.length} open task${open.length === 1 ? '' : 's'}.`);
  if (overdue.length) {
    parts.push(
      `${overdue.length} overdue: ${overdue.map((t) => t.title).join(', ')}.`,
    );
  }
  if (dueToday.length) {
    parts.push(
      `${dueToday.length} due today: ${dueToday.map((t) => t.title).join(', ')}.`,
    );
  }
  const order = byPriority.slice(0, 3).map((t, i) => `${i + 1}. ${t.title} (${t.priority})`);
  parts.push(`Suggested order: ${order.join('  ')}.`);
  return parts.join(' ');
}

/**
 * Generate a brief. In Phase 1 this always returns the deterministic fallback.
 * Phase 3 replaces the body with real OpenAI/Gemini calls, keeping this fallback
 * as the safety net.
 */
export async function generateBrief(tasks, _config = {}) {
  return { brief: fallbackBrief(tasks), source: 'fallback' };
}
