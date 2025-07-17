import { Request, Response } from 'express';
import User, { IUser } from '../modeles/utilisateur.modele'; // Assuming IUser is exported from your model
import { ApiResponse } from '../utilitaires/reponseApi';
import { validationResult } from 'express-validator';

// Extend the Express Request interface to include the user property
interface AuthRequest extends Request {
  user?: IUser; // Adjust to match your User model's interface
}

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('-password');
    if (!user) {
      return res.status(404).json(ApiResponse.error(404, 'User not found'));
    }
    res.status(200).json(ApiResponse.success('Profile retrieved', user));
  } catch (error) {
    res.status(500).json(ApiResponse.error(500, 'Server error', error));
  }
};