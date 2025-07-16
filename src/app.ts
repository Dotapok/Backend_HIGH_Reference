import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { swaggerSpec, swaggerUi } from './configurations/swagger';
import authRoutes from './routes/authentification.route';
import userRoutes from './routes/utilisateur.route';
import errorMiddleware from './middlewares/erreur.md';

const app = express();

// Middlewares de sécurité
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// Limite les requêtes à 100 par 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
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