import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../modeles/utilisateur.modele';
import { ApiResponse } from '../utilitaires/reponseApi';

// Extension de l'interface Request de Express
interface AuthRequest extends Request {
  user?: IUser;
}

// Interface pour le payload JWT
interface JwtPayload {
  userId: string;
}

// Déclaration des variables d'environnement
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET?: string;
    }
  }
}

/**
 * Middleware de protection des routes
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Récupération du token depuis le header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json(new ApiResponse(401, 'Non autorisé, token manquant'));
  }

  try {
    const secret = process.env.JWT_SECRET || 'high_reference';
    if (!secret) {
      throw new Error('JWT_SECRET non configuré');
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json(new ApiResponse(401, 'Non autorisé, utilisateur introuvable'));
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json(new ApiResponse(401, 'Non autorisé, token invalide'));
  }
};

/**
 * Middleware de vérification du rôle admin
 */
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json(
      new ApiResponse(403, 'Accès refusé, droits administrateur requis')
    );
  }
  next();
};

/**
 * Middleware de vérification du rôle utilisateur
 */
export const isUser = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'user') {
    return res.status(403).json(
      new ApiResponse(403, 'Accès refusé, droits utilisateur requis')
    );
  }
  next();
};