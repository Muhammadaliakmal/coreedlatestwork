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
const connectMongoDb = async (mongoUri) => {
    try {
        const uri = mongoUri || process.env.MONGODB_URL || 'mongodb://localhost:27017/project_management';

        // Mongoose ko MongoDB se connect karein
        const connection = await mongoose.connect(uri);

        console.log("✅ MongoDB connected successfully!");
        console.log(`📊 Database: ${connection.connection.name}`);
        console.log(`🌐 Host: ${connection.connection.host}`);

        return connection;
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        throw error; // Just throw the error to be handled by the caller
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