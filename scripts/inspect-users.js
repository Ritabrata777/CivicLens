import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data.db');
const db = new Database(dbPath, { verbose: console.log });

try {
    console.log('Inspecting users table...');
    const columns = db.prepare('PRAGMA table_info(users)').all();
    console.log('Columns:', columns.map(c => c.name));

    const users = db.prepare('SELECT * FROM users').all();
    console.log('Users:', JSON.stringify(users, null, 2));

} catch (error) {
    console.error('Inspection failed:', error);
}
