// db/connection.js

// .env file ko load karne ke liye
import { config } from 'dotenv';

import mongoose from 'mongoose';
config()
/**
 * MongoDB se connection establish karta hai
 * @param {string} ConnectionURL - MongoDB Atlas ka connection string
 * @returns {Promise} - Mongoose connection object
 */
const connectMongoDb = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;

        // If no MongoDB URI is provided, skip the connection
        if (!mongoUri || mongoUri.trim() === "") {
            console.log("⚠️  MongoDB URI not provided, skipping database connection");
            return null;
        }

        // Mongoose ko MongoDB se connect karein
        const connection = await mongoose.connect(mongoUri);

        console.log("✅ MongoDB connected successfully!");
        console.log(`📊 Database: ${connection.connection.name}`);
        console.log(`🌐 Host: ${connection.connection.host}`);

        return connection;
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        // Connection fail hone par application band kar dein
        process.exit(1);
    }
}

// Optional: Connection events track karne ke liye
mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected from MongoDB');
});


export default connectMongoDb;