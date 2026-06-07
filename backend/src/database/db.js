const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../crm.sqlite');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    position TEXT,
    status TEXT DEFAULT 'nuevo' CHECK(status IN ('nuevo','contactado','calificado','propuesta','ganado','perdido')),
    source TEXT DEFAULT 'manual' CHECK(source IN ('manual','web','referido','linkedin','email','otro')),
    value REAL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pipeline_stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    order_index INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pipeline_deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    stage_id INTEGER NOT NULL REFERENCES pipeline_stages(id) ON DELETE CASCADE,
    value REAL DEFAULT 0,
    probability INTEGER DEFAULT 50,
    expected_close TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'tarea' CHECK(type IN ('llamada','email','reunion','tarea','nota')),
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TEXT,
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

const stagesCount = db.prepare('SELECT COUNT(*) as count FROM pipeline_stages').get();
if (stagesCount.count === 0) {
  const insert = db.prepare('INSERT INTO pipeline_stages (name, color, order_index) VALUES (?, ?, ?)');
  insert.run('Prospecto', '#6366f1', 1);
  insert.run('Contactado', '#f59e0b', 2);
  insert.run('Propuesta Enviada', '#3b82f6', 3);
  insert.run('Negociación', '#8b5cf6', 4);
  insert.run('Cerrado Ganado', '#10b981', 5);
  insert.run('Cerrado Perdido', '#ef4444', 6);
}

module.exports = db;
