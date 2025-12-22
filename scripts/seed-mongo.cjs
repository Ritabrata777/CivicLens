
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function seed() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI not found");
        return;
    }

    try {
        await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'civitas_db' });
        console.log("Connected to MongoDB");

        // We use the raw collection to avoid needing the compiled Model class in this JS script
        const users = mongoose.connection.collection('users');

        const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLETS?.split(',')[0]?.trim().toLowerCase();

        if (!adminWallet) {
            console.error("No admin wallet found in NEXT_PUBLIC_ADMIN_WALLETS");
            return;
        }

        console.log(`Checking for admin wallet: ${adminWallet}`);

        const existing = await users.findOne({ _id: adminWallet });
        if (!existing) {
            console.log("Creating admin user...");
            await users.insertOne({
                _id: adminWallet,
                name: "Admin User",
                email: "admin@civic.local",
                role: "admin",
                avatar_url: "https://github.com/shadcn.png",
                created_at: new Date()
            });
            console.log("Admin user created.");
        } else {
            console.log("Admin user already exists. Updating role to be sure.");
            await users.updateOne({ _id: adminWallet }, { $set: { role: 'admin' } });
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        console.log("Done.");
    }
}

seed();
