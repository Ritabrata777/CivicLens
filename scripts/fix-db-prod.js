import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'civic-lens.db');
const db = new Database(dbPath, { verbose: console.log });

try {
    // 1. Promote User to Admin
    console.log('Promoting user-86483 to admin...');
    const info = db.prepare("UPDATE users SET role = 'admin' WHERE id = 'user-86483'").run();
    console.log(`Updated ${info.changes} user(s).`);

    // 2. Migrate Schema (Add missing columns)
    console.log('Verifying/Migrating schema...');
    const columns = db.prepare('PRAGMA table_info(issues)').all();
    const columnNames = columns.map(c => c.name);

    if (!columnNames.includes('license_plate')) {
        console.log('Adding license_plate column...');
        db.prepare('ALTER TABLE issues ADD COLUMN license_plate TEXT').run();
    } else {
        console.log('license_plate column already exists.');
    }

    if (!columnNames.includes('violation_type')) {
        console.log('Adding violation_type column...');
        db.prepare('ALTER TABLE issues ADD COLUMN violation_type TEXT').run();
    } else {
        console.log('violation_type column already exists.');
    }

    console.log('Fixes applied successfully.');

} catch (error) {
    console.error('Fix failed:', error);
}
