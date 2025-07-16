import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://mongo:ViPBbYGMQdLvXAwXhaXyNrmTszvGSPXk@crossover.proxy.rlwy.net:51160');
    console.log('MongoDB connecté avec succes.');
  } catch (error) {
    console.error('MongoDB connecxion erreur:', error);
    process.exit(1);
  }
};

export default connectDB;