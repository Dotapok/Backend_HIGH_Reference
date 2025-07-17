import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utilitaires/reponseApi';

// Extension de l'interface Request de Express
interface AuthRequest extends Request {
  user?: {
    _id: string;
    role: 'user' | 'admin';
  };
}

/**
 * Middleware pour vérifier si l'utilisateur est administrateur
 */
export const admin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Vérifier si l'utilisateur est connecté
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, 'Non autorisé, utilisateur non connecté'));
    }

    // Vérifier si l'utilisateur est administrateur
    if (req.user.role !== 'admin') {
      return res.status(403).json(new ApiResponse(403, 'Non autorisé, rôle administrateur requis'));
    }

    next();
  } catch (error) {
    res.status(500).json(new ApiResponse(500, 'Erreur serveur'));
  }
};
