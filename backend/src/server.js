import 'dotenv/config';
import { createApp } from './app.js';
import { createDb } from './db.js';

const db = createDb(process.env.DB_FILE ?? 'data/app.sqlite');
const app = createApp(db, {
  username: process.env.AUTH_USERNAME ?? 'admin',
  password: process.env.AUTH_PASSWORD ?? 'password',
  ai: {
    provider: process.env.AI_PROVIDER || '',
    apiKey: process.env.AI_API_KEY || '',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  },
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Daily Brief API listening on http://localhost:${port}`);
});
