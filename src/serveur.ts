import app from './app';
import connectDB from './configurations/db';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './modeles/utilisateur.modele';
import { registerMultiplayerGameSocketHandlers } from './controlleurs/game.controlleur';

dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'https://truenumber.up.railway.app'],
    credentials: true,
    methods: ['GET', 'POST']
  },
});

// Authentification sécurisée des sockets
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error: Token manquant'));
    }
    const secret = process.env.JWT_SECRET || 'high_reference';
    const decoded = jwt.verify(token, secret) as { userId: string };
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return next(new Error('Authentication error: Utilisateur introuvable'));
    }
    (socket as any).user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error: Token invalide'));
  }
});

io.on('connection', (socket) => {
  const user = (socket as any).user;
  console.log('Socket connecté:', user?.email, socket.id);
  // Ici, on pourra gérer les événements du jeu multijoueur
  socket.on('disconnect', () => {
    console.log('Socket déconnecté:', user?.email, socket.id);
  });
});

// Enregistrement des handlers Socket.IO pour le jeu multijoueur
registerMultiplayerGameSocketHandlers();

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Serveur en ecoute mode ${NODE_ENV} sur le port ${PORT}`);
      console.log(`API docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Echec de demarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();

export { io };