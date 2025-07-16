import { Request, Response } from 'express';
import User from '../modeles/utilisateur.modele';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../utilitaires/reponseApi';

// Définissez une interface pour votre payload JWT
interface JwtPayload {
  userId: string;
}

// Définissez le type pour les variables d'environnement
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET?: string; // Optional to handle undefined cases
      JWT_EXPIRES_IN?: string; // Optional to handle undefined cases
    }
  }
}

const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    { userId },
    secret as Secret, // Explicitly cast to Secret
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h', // Fallback to '1h' if undefined
    } as SignOptions
  );
};

export const register = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(new ApiResponse(400, 'Validation error', { errors: errors.array() }));
  }

  try {
    const { firstName, lastName, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(new ApiResponse(400, 'Email already in use'));
    }

    // Créer un nouvel utilisateur
    const user = await User.create({ firstName, lastName, email, password });

    // Générer le token JWT
    const token = generateToken(user._id.toString());

    res.status(201).json(
      new ApiResponse(201, 'User registered successfully', {
        user: user.toObject(),
        token,
      })
    );
  } catch (error) {
    res.status(500).json(new ApiResponse(500, 'Server error', { error }));
  }
};

export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(new ApiResponse(400, 'Validation error', { errors: errors.array() }));
  }

  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json(new ApiResponse(401, 'Invalid credentials'));
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json(new ApiResponse(401, 'Invalid credentials'));
    }

    // Générer le token JWT
    const token = generateToken(user._id.toString());

    res.status(200).json(
      new ApiResponse(200, 'Login successful', {
        user: user.toObject(),
        token,
      })
    );
  } catch (error) {
    res.status(500).json(new ApiResponse(500, 'Server error', { error }));
  }
};