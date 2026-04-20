/**
 * Database Connection Configuration
 * Handles MongoDB connection using Mongoose
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * Note: MongoDB is optional. Firebase is now the primary database.
 * Server will continue to run even if MongoDB connection fails.
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/collabsphere';

    console.log('🔗 Attempting to connect to MongoDB...');
    console.log(`📍 Connection URI: ${mongoURI.split('@')[0]}@****`);
    console.log(`⏱️  Server Selection Timeout: 5000ms`);

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
    });

    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.db.name}`);

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

  } catch (error) {
    console.warn('⚠️  MongoDB Connection Failed - Continuing with Firebase only');
    console.warn('Error Message:', error.message);
    console.log('ℹ️  Server will operate using Firebase Firestore for data persistence');
    console.log('5. Check if your network/firewall blocks port 27017');
    
    // Don't exit, allow server to continue running for debugging
  }
};

module.exports = connectDB;
