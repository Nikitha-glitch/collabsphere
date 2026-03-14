/**
 * Database Connection Configuration
 * Handles MongoDB connection using Mongoose
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * @throws {Error} If connection fails
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
    console.error('❌ MongoDB Connection Failed');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Full Error:', error);
    console.log('\n📋 Troubleshooting Steps:');
    console.log('1. Check MongoDB Atlas cluster status for service disruptions');
    console.log('2. Verify credentials: nikitha / password in .env');
    console.log('3. Ensure your IP (0.0.0.0/0) is whitelisted in Network Access');
    console.log('4. Try connecting from MongoDB Compass to test credentials');
    console.log('5. Check if your network/firewall blocks port 27017');
    
    // Don't exit, allow server to continue running for debugging
  }
};

module.exports = connectDB;
