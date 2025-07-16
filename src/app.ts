import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { swaggerSpec, swaggerUi } from './configurations/swagger';
import authRoutes from './routes/authentification.route';
import userRoutes from './routes/utilisateur.route';
import errorMiddleware from './middlewares/erreur.md';

const app = express();

// Configuration CORS qui accepte toutes les origines
const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Accepte toutes les origines
    callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middlewares de sécurité
app.use(helmet());
app.use(cors(corsOptions)); // Une seule configuration CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Limite les requêtes
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