const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function listUsers() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI not found in .env");
        return;
    }

    try {
        await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'civitas_db' });
        console.log("Connected to DB");

        const cols = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections present:", cols.map(c => c.name));

        const usersCollection = mongoose.connection.collection('users');
        const users = await usersCollection.find({}).toArray();

        console.log("\n--- Users ---");
        users.forEach(user => {
            console.log(`ID: ${user._id}, Name: ${user.name}, Role: ${user.role}, Email: ${user.email}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

listUsers();
