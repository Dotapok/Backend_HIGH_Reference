import { Request, Response } from 'express';
import User from '../modeles/utilisateur.modele';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../utilitaires/reponseApi';

// Définissez une interface pour votre payload JWT
interface JwtPayload {
  userId: string;
}

const generateToken = (userId: string, role: string): string => {
  const secret = process.env.JWT_SECRET || 'high_reference';
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    { userId, role }, // Inclure le rôle dans le payload
    secret as Secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    } as SignOptions
  );
};

// Définissez le type pour les variables d'environnement
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET?: string; // Optional to handle undefined cases
      JWT_EXPIRES_IN?: string; // Optional to handle undefined cases
    }
  }
}

export const register = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(new ApiResponse(400, 'Validation error', { errors: errors.array() }));
  }

  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(new ApiResponse(400, 'Email already in use'));
    }

    // Créer un nouvel utilisateur avec les valeurs par défaut
    const user = await User.create({ 
      firstName, 
      lastName, 
      email, 
      phone,
      password,
      role: 'user', // Valeur par défaut
      points: 0,    // Valeur par défaut
    });

    // Générer le token JWT
    const token = generateToken(user._id.toString(),'user');

    // Préparer la réponse utilisateur sans le mot de passe
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      points: user.points,
      bio: user.bio,
      createdAt: user.createdAt
    };

    res.status(201).json(
      new ApiResponse(201, 'User registered successfully', {
        user: userResponse,
        token,
      })
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json(new ApiResponse(500, 'Server error'));
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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json(new ApiResponse(401, 'Invalid credentials'));
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json(new ApiResponse(401, 'Invalid credentials'));
    }

    // Générer le token JWT avec le rôle de l'utilisateur
    const token = generateToken(user._id.toString(), user.role);

    // Préparer la réponse utilisateur sans le mot de passe
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      points: user.points,
      bio: user.bio,
      createdAt: user.createdAt
    };

    res.status(200).json(
      new ApiResponse(200, 'Login successful', {
        user: userResponse,
        token,
      })
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(new ApiResponse(500, 'Server error'));
  }
};