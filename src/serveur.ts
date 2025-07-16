import app from './app';
import connectDB from './configurations/db';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Serveur en ecoute mode ${NODE_ENV} sur le port ${PORT}`);
      console.log(`API docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Echec de demarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();