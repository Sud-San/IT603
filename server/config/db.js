import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is missing. Copy server/.env.example to server/.env.');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error) {
    console.error('Could not connect to MongoDB. Is the database running?');
    console.error(`Expected MONGO_URI=${uri}`);
    console.error(error.message);
    process.exit(1);
  }
}
