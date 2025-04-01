import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Initialize database connection
async function openDb() {
  return open({
    filename: './schema_results.db',
    driver: sqlite3.Database
  });
}

// Initialize database tables
async function initDb() {
  const db = await openDb();
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      input TEXT NOT NULL,
      output TEXT NOT NULL
    )
  `);

  return db;
}

// Store a new result
export async function storeResult(input, output) {
  const db = await initDb();
  
  const result = await db.run(
    'INSERT INTO schema_results (input, output) VALUES (?, ?)',
    [input, output]
  );
  
  return result.lastID;
}

// Get all results
export async function getResults() {
  const db = await initDb();
  
  return db.all('SELECT * FROM schema_results ORDER BY query_time DESC');
}

// Get result by ID
export async function getResultById(id) {
  const db = await initDb();
  
  return db.get('SELECT * FROM schema_results WHERE id = ?', [id]);
}

// Initialize database on module load
initDb().catch(console.error); 