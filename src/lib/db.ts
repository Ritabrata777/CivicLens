import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_DIRECT_URI?.trim() || process.env.MONGODB_URI?.trim();

if (!MONGODB_URI) {
    throw new Error('Please define MONGODB_URI or MONGODB_DIRECT_URI inside .env');
}

export class DatabaseConnectionError extends Error {
    constructor(message: string, public readonly cause?: unknown) {
        super(message);
        this.name = 'DatabaseConnectionError';
    }
}

function formatConnectionError(error: unknown) {
    const rawMessage = error instanceof Error ? error.message : String(error);

    if (rawMessage.includes('querySrv ECONNREFUSED')) {
        return [
            'MongoDB SRV lookup failed while resolving your Atlas hostname.',
            'Your current network or DNS resolver is refusing `_mongodb._tcp` lookups.',
            'Use a standard `mongodb://` connection string in `MONGODB_DIRECT_URI`, or switch to a DNS/network that allows SRV resolution.'
        ].join(' ');
    }

    return rawMessage;
}

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
    lastFailureAt?: number;
    lastFailureMessage?: string;
}

declare global {
    var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const DATABASE_RETRY_COOLDOWN_MS = 15000;

async function connectToDatabase() {
    if (cached!.conn) {
        return cached!.conn;
    }

    if (
        cached!.lastFailureAt &&
        Date.now() - cached!.lastFailureAt < DATABASE_RETRY_COOLDOWN_MS
    ) {
        throw new DatabaseConnectionError(
            cached!.lastFailureMessage || 'Skipping MongoDB reconnect during cooldown window.'
        );
    }

    if (!cached!.promise) {
        const opts = {
            bufferCommands: false,
            dbName: process.env.MONGODB_DB_NAME,
            serverSelectionTimeoutMS: 3000,
            connectTimeoutMS: 3000,
            socketTimeoutMS: 5000,
        };

        cached!.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached!.conn = await cached!.promise;
        cached!.lastFailureAt = undefined;
        cached!.lastFailureMessage = undefined;
    } catch (e) {
        cached!.promise = null;
        const message = formatConnectionError(e);
        cached!.lastFailureAt = Date.now();
        cached!.lastFailureMessage = message;
        throw new DatabaseConnectionError(message, e);
    }

    return cached!.conn;
}

export default connectToDatabase;
