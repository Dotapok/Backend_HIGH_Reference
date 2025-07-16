import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middlewares/authentification.md';
import { getProfile, updateProfile, deleteProfile } from '../controlleurs/utilisateur.controlleur';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management
 */

router.use(protect); // Toutes les routes suivantes sont protégées

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 */
router.get('/me', getProfile);

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               bio:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch(
  '/me',
  [
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('bio').optional().trim(),
    body('profilePicture').optional().isURL().withMessage('Invalid URL for profile picture')
  ],
  updateProfile
);

/**
 * @swagger
 * /api/users/me:
 *   delete:
 *     summary: Delete user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 */
router.delete('/me', deleteProfile);

export default router;