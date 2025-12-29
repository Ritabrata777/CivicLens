import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'civic-lens.db');
console.log('Opening DB at:', dbPath);
const db = new Database(dbPath, { verbose: console.log });

try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables in DB:', tables);
} catch (error) {
    console.error('List tables failed:', error);
}
