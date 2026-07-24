import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Create/open a SQLite database and ensure the schema exists.
 * Pass ':memory:' for an ephemeral DB (used by tests).
 */
export function createDb(file = 'data/app.sqlite') {
  if (file !== ':memory:') {
    mkdirSync(dirname(file), { recursive: true });
  }
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      dueDate     TEXT,
      priority    TEXT NOT NULL DEFAULT 'medium',
      status      TEXT NOT NULL DEFAULT 'open',
      createdAt   TEXT NOT NULL,
      updatedAt   TEXT NOT NULL
    );
  `);
  return db;
}
