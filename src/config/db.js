const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Connection options optimized for production
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10
        };

        await mongoose.connect(process.env.MONGO_URI, options);
        console.log('✅ MongoDB connected successfully');

        // Connection events
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        setTimeout(connectDB, 5000); // Retry after 5 seconds
    }
};

module.exports = connectDB;
