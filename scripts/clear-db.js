
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: '.env' });

async function clearDatabase() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI is not defined in .env');
        process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB to clear data...');

    try {
        await mongoose.connect(uri);
        console.log('✅ Connected.');

        const collections = [
            'issues',
            'users',
            'blockchaintransactions',
            'issueupdates',
            'issueupvotes',
            'resolutionevidences'
        ];

        for (const collectionName of collections) {
            try {
                const collection = mongoose.connection.collection(collectionName);
                // Check if exists before dropping to avoid errors
                const exists = await collection.countDocuments().catch(() => 0);
                if (exists > 0) {
                    await collection.drop();
                    console.log(`🗑️  Dropped collection: ${collectionName}`);
                } else {
                    console.log(`ℹ️  Collection ${collectionName} is empty or doesn't exist.`);
                }
            } catch (err) {
                // If drop fails (e.g. doesn't exist), just ignore
                if (err.code === 26) {
                    console.log(`ℹ️  Collection ${collectionName} does not exist (ns not found).`);
                } else {
                    console.error(`⚠️  Error clearing ${collectionName}:`, err.message);
                }
            }
        }

        console.log('✨ Database cleared successfully!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Database cleanup failed:');
        console.error(error);
        process.exit(1);
    }
}

clearDatabase();
