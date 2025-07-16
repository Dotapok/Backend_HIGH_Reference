import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utilitaires/reponseApi';

export default function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err.stack);

  // Erreurs de validation
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val: any) => val.message);
    return res.status(400).json(ApiResponse.error(400, 'Validation error', messages));
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(ApiResponse.error(401, 'Invalid token'));
  }

  // Erreur JWT expiré
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(ApiResponse.error(401, 'Token expired'));
  }

  // Erreur MongoDB duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json(ApiResponse.error(400, `${field} already exists`));
  }

  // Erreur serveur par défaut
  res.status(500).json(ApiResponse.error(500, 'Server error', err.message));
}