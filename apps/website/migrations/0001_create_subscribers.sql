-- Waitlist for the landing page. Email is the primary key so a repeat signup is a
-- no-op (INSERT ... ON CONFLICT DO NOTHING), and created_at lets us order the list
-- when we export it to notify people.
CREATE TABLE IF NOT EXISTS subscribers (
  email TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
