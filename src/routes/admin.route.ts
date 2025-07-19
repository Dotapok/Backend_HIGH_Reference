import { Router } from 'express';
import { body } from 'express-validator';
import { protect, isAdmin } from '../middlewares/authentification.md';
import { 
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllGames
} from '../controlleurs/admin.controlleur';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Administration
 *   description: Gestion des utilisateurs par l'administrateur
 */

router.use(protect, isAdmin); 

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Liste tous les utilisateurs (Admin seulement)
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       role:
 *                         type: string
 *                         enum: ["user", "admin"]
 *                       points:
 *                         type: number
 *                       bio:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé (non admin)
 *       500:
 *         description: Erreur serveur
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Crée un nouvel utilisateur (Admin seulement)
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 default: user
 *               bio:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utilisateur créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 role:
 *                   type: string
 *                 points:
 *                   type: number
 *                 bio:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */
router.post(
  '/users',
  [
    body('firstName').notEmpty().withMessage('Le prénom est requis'),
    body('lastName').notEmpty().withMessage('Le nom est requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('phone').notEmpty().withMessage('Le téléphone est requis'),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit faire au moins 6 caractères'),
    body('role').optional().isIn(['user', 'admin']),
    body('bio').optional()
  ],
  createUser
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   patch:
 *     summary: Met à jour un utilisateur (Admin seulement)
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *               points:
 *                 type: number
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 role:
 *                   type: string
 *                 points:
 *                   type: number
 *                 bio:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.patch(
  '/users/:id',
  [
    body('firstName').optional().notEmpty(),
    body('lastName').optional().notEmpty(),
    body('email').optional().isEmail(),
    body('phone').optional().notEmpty(),
    body('role').optional().isIn(['user', 'admin']),
    body('points').optional().isNumeric(),
    body('bio').optional()
  ],
  updateUser
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Supprime un utilisateur (Admin seulement)
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Utilisateur supprimé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utilisateur supprimé avec succès"
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/users/:id', deleteUser);

/**
 * @swagger
 * components:
 *   schemas:
 *     Game:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *         number:
 *           type: number
 *         result:
 *           type: string
 *           enum: [win, lose]
 *         pointsChange:
 *           type: number
 *         newBalance:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/admin/games:
 *   get:
 *     summary: Récupère l'historique complet de toutes les parties (Admin seulement)
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Historique des parties récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 games:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Game'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé (non admin)
 *       500:
 *         description: Erreur serveur
 */
router.get('/games', getAllGames);

export default router;