import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data.db');
const db = new Database(dbPath, { verbose: console.log });

console.log('Seeding database...');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    avatar_url TEXT,
    role TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    category TEXT,
    status TEXT,
    location_address TEXT,
    location_lat REAL,
    location_lng REAL,
    image_url TEXT,
    image_hint TEXT,
    submitted_by TEXT,
    submitted_at INTEGER,
    upvotes INTEGER,
    is_urgent INTEGER,
    license_plate TEXT,
    violation_type TEXT
  );

  CREATE TABLE IF NOT EXISTS issue_updates (
    issue_id TEXT,
    status TEXT,
    timestamp INTEGER,
    updated_by TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS issue_upvotes (
    issue_id TEXT,
    user_id TEXT
  );
`);

// Check if admin exists
const admin = db.prepare('SELECT * FROM users WHERE role = ?').get('admin');

if (!admin) {
    console.log('Creating admin user...');
    db.prepare(`
    INSERT INTO users (id, name, email, avatar_url, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('admin-1', 'Admin User', 'admin@civic.com', 'https://github.com/shadcn.png', 'admin', Date.now());
} else {
    console.log('Admin user already exists.');
}

console.log('Seeding done.');
