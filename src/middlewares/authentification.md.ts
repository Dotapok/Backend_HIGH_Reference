import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../modeles/utilisateur.modele'; // Assuming IUser is the interface for your User model
import { ApiResponse } from '../utilitaires/reponseApi';

// Extend the Express Request interface to include the user property
interface AuthRequest extends Request {
  user?: IUser; // Adjust the type to match your User model's interface
}

// Define the JWT payload interface
interface JwtPayload {
  userId: string;
}

// Ensure JWT_SECRET is defined in environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET?: string; // Optional to handle undefined cases
    }
  }
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Check for Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json(new ApiResponse(401, 'Not authorized, no token'));
  }

  try {
    // Verify token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Attach user to request object
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json(new ApiResponse(401, 'Not authorized, user not found'));
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json(new ApiResponse(401, 'Not authorized, token failed'));
  }
};