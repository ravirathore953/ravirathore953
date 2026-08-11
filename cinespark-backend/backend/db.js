const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "data", "leads.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    organization TEXT NOT NULL,
    email TEXT NOT NULL,
    service TEXT NOT NULL,
    message TEXT,
    ip TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const insertLead = db.prepare(`
  INSERT INTO leads (name, organization, email, service, message, ip)
  VALUES (@name, @organization, @email, @service, @message, @ip)
`);

const listLeads = db.prepare(`
  SELECT id, name, organization, email, service, message, created_at
  FROM leads
  ORDER BY created_at DESC
  LIMIT @limit
`);

module.exports = {
  db,
  insertLead,
  listLeads,
};
