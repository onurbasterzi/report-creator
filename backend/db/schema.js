import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'database.sqlite');

let db = null;

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Wrapper to mimic better-sqlite3 API
const dbWrapper = {
  prepare(sql) {
    return {
      get(...params) {
        if (!db) throw new Error('Database not initialized');
        const stmt = db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      run(...params) {
        if (!db) throw new Error('Database not initialized');
        db.run(sql, params.length > 0 ? params : undefined);
        const lastId = db.exec("SELECT last_insert_rowid()");
        saveDb();
        return { lastInsertRowid: lastId[0]?.values[0]?.[0] || 0, changes: db.getRowsModified() };
      },
      all(...params) {
        if (!db) throw new Error('Database not initialized');
        const stmt = db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };
  },
  exec(sql) {
    if (!db) throw new Error('Database not initialized');
    db.run(sql);
    saveDb();
  }
};

async function initDb() {
  if (db) return;

  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('todo', 'in_progress', 'done', 'deadlines', 'working', 'completed', 'planning', 'risks_blockers')),
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      generated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      provider TEXT DEFAULT 'gemini',
      gemini_api_key TEXT,
      minimax_api_key TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run('INSERT OR IGNORE INTO settings (id, provider) VALUES (1, \'gemini\')');

  // Migrations
  try { db.run("ALTER TABLE settings ADD COLUMN gemini_api_key TEXT"); } catch (e) { }
  try { db.run("ALTER TABLE settings ADD COLUMN minimax_api_key TEXT"); } catch (e) { }
  try { db.run("ALTER TABLE entries ADD COLUMN sort_order INTEGER DEFAULT 0"); } catch (e) { }
  try { db.run("UPDATE entries SET category = 'in_progress' WHERE category = 'in-progress'"); } catch (e) { }
  try { db.run("UPDATE entries SET category = 'risks_blockers' WHERE category = 'blocked'"); } catch (e) { }

  saveDb();
}

export { initDb, dbWrapper as db };
export default dbWrapper;
