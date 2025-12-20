import Database from 'better-sqlite3';
import path from 'path';
import process from 'process';

const dbPath = path.join(process.cwd(), 'civic-lens.db');
const db = new Database(dbPath);

console.log('Adding resolution_evidence table...');

try {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS resolution_evidence (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            issue_id TEXT NOT NULL,
            admin_id TEXT NOT NULL,
            image_url TEXT NOT NULL,
            notes TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(issue_id) REFERENCES issues(id),
            FOREIGN KEY(admin_id) REFERENCES users(id)
        )
    `).run();
    console.log('Success: resolution_evidence table created.');
} catch (error) {
    console.error('Error creating table:', error);
}

db.close();
