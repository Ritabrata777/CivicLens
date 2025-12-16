import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'civic-lens.db');

// Ensure db directory exists if we were putting it in a subdirectory, 
// but we are putting it in root for simplicity.
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    voter_id_front_url TEXT,
    voter_id_back_url TEXT,
    role TEXT DEFAULT 'user',
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    location_address TEXT,
    location_lat REAL,
    location_lng REAL,
    image_url TEXT,
    image_hint TEXT,
    submitted_by TEXT,
    submitted_at INTEGER,
    upvotes INTEGER DEFAULT 0,
    is_urgent INTEGER DEFAULT 0,
    FOREIGN KEY(submitted_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS issue_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_id TEXT NOT NULL,
    status TEXT NOT NULL,
    timestamp INTEGER,
    updated_by TEXT,
    notes TEXT,
    FOREIGN KEY(issue_id) REFERENCES issues(id)
  );

  CREATE TABLE IF NOT EXISTS issue_upvotes (
    issue_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    timestamp INTEGER DEFAULT (strftime('%s', 'now')),
    PRIMARY KEY (issue_id, user_id),
    FOREIGN KEY(issue_id) REFERENCES issues(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  
  
`);

export default db;
