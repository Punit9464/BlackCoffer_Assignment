import mongoose from "mongoose";
import { cache } from "react";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    throw new Error("Define a MONGODB URL in the environment variables first");
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            autoIndex: false,
            bufferCommands: false,
            maxPoolSize: 10,           // Connection pool size
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,                 // Use IPv4
            retryWrites: true,
            retryReads: true
        }).then((con) => {
            return con
        })
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;