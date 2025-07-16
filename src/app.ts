import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { swaggerSpec, swaggerUi } from './configurations/swagger';
import authRoutes from './routes/authentification.route';
import userRoutes from './routes/utilisateur.route';
import errorMiddleware from './middlewares/erreur.md';

const app = express();

// Liste des origines autorisées
const allowedOrigins = [
  'https://www.projetauthentification-production.up.railway.app',
  'https://projetauthentification-production.up.railway.app',
  'http://localhost:5173'
];

// Configuration CORS avec typage TypeScript
const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Autorise les requêtes sans origine (comme les requêtes curl) en développement
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (origin && allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middlewares de sécurité
app.use(helmet());
app.use(cors(corsOptions)); // Utilisez la configuration CORS une seule fois
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