import { Router } from 'express';
import { body } from 'express-validator';
import { register, login } from '../controlleurs/auth.controlleur';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentification
 *   description: Gestion de l'authentification des utilisateurs
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Enregistrement d'un nouvel utilisateur
 *     tags: [Authentification]
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
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Prénom de l'utilisateur
 *                 example: Jean
 *               lastName:
 *                 type: string
 *                 description: Nom de famille de l'utilisateur
 *                 example: Dupont
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Adresse email valide
 *                 example: jean.dupont@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Mot de passe (minimum 6 caractères)
 *                 example: MonMotDePasse123
 *     responses:
 *       201:
 *         description: Utilisateur enregistré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: number
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: "Utilisateur enregistré avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         firstName:
 *                           type: string
 *                           example: "Jean"
 *                         lastName:
 *                           type: string
 *                           example: "Dupont"
 *                         email:
 *                           type: string
 *                           example: "jean.dupont@example.com"
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Erreur de validation
 *       500:
 *         description: Erreur serveur
 */
router.post(
  '/register',
  [
    body('firstName').notEmpty().withMessage('Le prénom est obligatoire'),
    body('lastName').notEmpty().withMessage('Le nom de famille est obligatoire'),
    body('email').isEmail().withMessage('Veuillez fournir une adresse email valide'),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
  ],
  register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Adresse email enregistrée
 *                 example: jean.dupont@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mot de passe
 *                 example: MonMotDePasse123
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Connexion réussie"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439011"
 *                         firstName:
 *                           type: string
 *                           example: "Jean"
 *                         lastName:
 *                           type: string
 *                           example: "Dupont"
 *                         email:
 *                           type: string
 *                           example: "jean.dupont@example.com"
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Identifiants invalides
 *       500:
 *         description: Erreur serveur
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Veuillez fournir une adresse email valide'),
    body('password').notEmpty().withMessage('Le mot de passe est obligatoire')
  ],
  login
);

export default router;