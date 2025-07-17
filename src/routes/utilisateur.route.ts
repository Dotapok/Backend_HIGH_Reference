import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middlewares/authentification.md';
import { getProfile } from '../controlleurs/utilisateur.controlleur';

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
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "507f1f77bcf86cd799439011"
 *                 firstName:
 *                   type: string
 *                   example: "Jean"
 *                 lastName:
 *                   type: string
 *                   example: "Dupont"
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: "jean.dupont@example.com"
 *                 phone:
 *                   type: string
 *                   example: "+1234567890"
 *                 role:
 *                   type: string
 *                   enum: ["user", "admin"]
 *                   example: "user"
 *                 points:
 *                   type: number
 *                   example: 100
 *                 bio:
 *                   type: string
 *                   example: "Développeur full-stack passionné"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Non autorisé - Token invalide ou manquant
 *       500:
 *         description: Erreur serveur
 */
router.get('/me', getProfile);

export default router;