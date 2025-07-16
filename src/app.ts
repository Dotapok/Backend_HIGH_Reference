import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { swaggerSpec, swaggerUi } from './configurations/swagger';
import authRoutes from './routes/authentification.route';
import userRoutes from './routes/utilisateur.route';
import errorMiddleware from './middlewares/erreur.md';

const app = express();

// Middlewares de sécurité
app.use(helmet()); // Protège contre les vulnérabilités courantes via les headers
app.use(cors()); // Gère les autorisations CORS
app.use(express.json()); // Parse le JSON entrant
app.use(express.urlencoded({ extended: true })); // Parse les URL encodées

// Limite les requêtes à 100 par 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par fenêtre
});
app.use(limiter);

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Middleware de gestion d'erreurs
app.use(errorMiddleware);

export default app;