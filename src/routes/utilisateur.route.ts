import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middlewares/authentification.md';
import { getProfile, updateProfile, deleteProfile } from '../controlleurs/utilisateur.controlleur';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Utilisateurs
 *   description: Gestion du profil utilisateur
 */

router.use(protect); // Protection de toutes les routes suivantes

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Obtenir le profil de l'utilisateur courant
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données du profil utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Non autorisé - Token invalide ou manquant
 *       500:
 *         description: Erreur serveur
 */
router.get('/me', getProfile);

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Mettre à jour le profil utilisateur
 *     tags: [Utilisateurs]
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
 *                 description: Nouveau prénom
 *                 example: Jean
 *               lastName:
 *                 type: string
 *                 description: Nouveau nom de famille
 *                 example: Martin
 *               bio:
 *                 type: string
 *                 description: Biographie de l'utilisateur
 *                 example: Développeur full-stack passionné
 *               profilePicture:
 *                 type: string
 *                 format: url
 *                 description: URL de la photo de profil
 *                 example: https://example.com/photo.jpg
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.patch(
  '/me',
  [
    body('firstName').optional().notEmpty().withMessage('Le prénom ne peut pas être vide'),
    body('lastName').optional().notEmpty().withMessage('Le nom de famille ne peut pas être vide'),
    body('bio').optional().trim(),
    body('profilePicture').optional().isURL().withMessage('URL de photo de profil invalide')
  ],
  updateProfile
);

/**
 * @swagger
 * /api/users/me:
 *   delete:
 *     summary: Supprimer le compte utilisateur
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compte supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/me', deleteProfile);

export default router;