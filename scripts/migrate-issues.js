import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data.db');
const db = new Database(dbPath, { verbose: console.log });

try {
    console.log('Verifying database schema...');

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

    console.log('Schema verification completed.');
} catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
}
