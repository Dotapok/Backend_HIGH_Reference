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

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(ApiResponse.error(400, 'Validation error', errors.array()));
  }

  try {
    const updates = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      bio: req.body.bio,
      profilePicture: req.body.profilePicture,
    };

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json(ApiResponse.error(404, 'User not found'));
    }

    res.status(200).json(ApiResponse.success('Profile updated', user));
  } catch (error) {
    res.status(500).json(ApiResponse.error(500, 'Server error', error));
  }
};

export const deleteProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.user?._id);
    if (!user) {
      return res.status(404).json(ApiResponse.error(404, 'User not found'));
    }
    res.status(200).json(ApiResponse.success('Account deleted'));
  } catch (error) {
    res.status(500).json(ApiResponse.error(500, 'Server error', error));
  }
};