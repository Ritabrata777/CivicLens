import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'civic-lens.db');
console.log('Opening DB at:', dbPath);
const db = new Database(dbPath);

try {
    console.log('Creating blockchain_transactions table...');
    db.exec(`
    CREATE TABLE IF NOT EXISTS blockchain_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_id TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      admin_id TEXT NOT NULL,
      status TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      explorer_url TEXT,
      FOREIGN KEY(issue_id) REFERENCES issues(id)
    )
  `);
    console.log('blockchain_transactions table created successfully.');
} catch (error) {
    console.error('Error creating table:', error); 
}
