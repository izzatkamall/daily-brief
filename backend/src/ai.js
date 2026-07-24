/**
 * Daily Brief generation.
 *
 * Strategy: build a compact, deterministic description of the open tasks, then
 * ask an LLM to turn it into a short natural-language brief. If no provider/key
 * is configured (or the call fails) we fall back to a deterministic locally
 * generated brief so the feature always works.
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
    parts.push(`${overdue.length} overdue: ${overdue.map((t) => t.title).join(', ')}.`);
  }
  if (dueToday.length) {
    parts.push(`${dueToday.length} due today: ${dueToday.map((t) => t.title).join(', ')}.`);
  }
  const order = byPriority.slice(0, 3).map((t, i) => `${i + 1}. ${t.title} (${t.priority})`);
  parts.push(`Suggested order: ${order.join('  ')}.`);
  return parts.join(' ');
}

/** Build the LLM prompt from the categorized tasks. */
function buildPrompt(tasks) {
  const { open, overdue, dueToday, upcoming } = analyzeTasks(tasks);
  const fmt = (t) =>
    `- "${t.title}" (priority: ${t.priority}${t.dueDate ? `, due ${t.dueDate.slice(0, 10)}` : ', no due date'})` +
    (t.description ? ` — ${t.description}` : '');

  const today = startOfToday().toISOString().slice(0, 10);
  const lines = [
    `Today is ${today}. You are a concise, friendly productivity assistant.`,
    `Write a short "Daily Brief" (3-5 sentences, plain prose, no markdown headings) summarizing the user's open tasks.`,
    `Mention what is overdue, what is due today, and suggest a sensible order to tackle them. Be encouraging but brief.`,
    '',
    `Open tasks: ${open.length}`,
  ];
  if (overdue.length) lines.push(`Overdue:\n${overdue.map(fmt).join('\n')}`);
  if (dueToday.length) lines.push(`Due today:\n${dueToday.map(fmt).join('\n')}`);
  if (upcoming.length) lines.push(`Upcoming / no date:\n${upcoming.map(fmt).join('\n')}`);
  if (open.length === 0) lines.push('There are no open tasks.');
  return lines.join('\n');
}

async function callGemini(prompt, { apiKey, model }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      // Newer flash models spend part of the budget on internal "thinking",
      // so give a generous cap to leave room for the visible brief.
      generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  if (!text.trim()) throw new Error('Gemini returned empty text');
  return text.trim();
}

async function callOpenAI(prompt, { apiKey, model }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.5,
      max_tokens: 300,
      messages: [
        { role: 'system', content: 'You are a concise, friendly productivity assistant.' },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  if (!text.trim()) throw new Error('OpenAI returned empty text');
  return text.trim();
}

/**
 * Generate a brief. Uses the configured provider; on any error (or no key)
 * falls back to the deterministic local brief so the endpoint never fails.
 */
export async function generateBrief(tasks, config = {}) {
  const { provider, apiKey } = config;
  if (!provider || !apiKey) {
    return { brief: fallbackBrief(tasks), source: 'fallback' };
  }
  try {
    const prompt = buildPrompt(tasks);
    let text;
    if (provider === 'gemini') {
      text = await callGemini(prompt, { apiKey, model: config.geminiModel ?? 'gemini-2.5-flash' });
    } else if (provider === 'openai') {
      text = await callOpenAI(prompt, { apiKey, model: config.openaiModel ?? 'gpt-4o-mini' });
    } else {
      return { brief: fallbackBrief(tasks), source: 'fallback' };
    }
    return { brief: text, source: provider };
  } catch (err) {
    console.error('[ai] brief generation failed, using fallback:', err.message);
    return { brief: fallbackBrief(tasks), source: 'fallback', error: err.message };
  }
}
