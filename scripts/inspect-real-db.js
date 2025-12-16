import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'civic-lens.db');
console.log('Opening DB at:', dbPath);
const db = new Database(dbPath, { verbose: console.log });

try {
    const users = db.prepare('SELECT id, name, role FROM users').all();
    console.log('Users in civic-lens.db:', JSON.stringify(users, null, 2));
} catch (error) {
    console.error('Inspect users failed:', error);
}
