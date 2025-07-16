import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('MongoDB connecté avec succes.');
  } catch (error) {
    console.error('MongoDB connection erreur:', error);
    process.exit(1);
  }
};

export default connectDB;