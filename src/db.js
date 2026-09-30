import Database from 'better-sqlite3';

export const db = new Database(process.env.DB_PATH ?? 'invoices.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS invoices (
    id          INTEGER PRIMARY KEY,
    owner_id    INTEGER NOT NULL,
    customer    TEXT    NOT NULL,
    amount_cents INTEGER NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'open'
  );
`);
