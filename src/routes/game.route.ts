import { Router } from 'express';
import { protect } from '../middlewares/authentification.md';
import { 
  playGame,
  getGameHistory,
  getPointsBalance
} from '../controlleurs/game.controlleur';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Jeu
 *   description: Gestion du jeu TrueNumber
 */

router.use(protect); // Protection pour toutes les routes

/**
 * @swagger
 * /api/game/play:
 *   post:
 *     summary: Joue une partie de TrueNumber
 *     tags: [Jeu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Résultat de la partie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 number:
 *                   type: number
 *                   description: Nombre généré aléatoirement
 *                   example: 75
 *                 result:
 *                   type: string
 *                   enum: [win, lose]
 *                   description: Résultat de la partie
 *                   example: win
 *                 pointsChange:
 *                   type: number
 *                   description: Points gagnés ou perdus
 *                   example: 50
 *                 newBalance:
 *                   type: number
 *                   description: Nouveau total de points
 *                   example: 150
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.post('/play', playGame);

/**
 * @swagger
 * /api/game/history:
 *   get:
 *     summary: Récupère l'historique des parties
 *     tags: [Jeu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historique des parties
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   number:
 *                     type: number
 *                   result:
 *                     type: string
 *                     enum: [win, lose]
 *                   pointsChange:
 *                     type: number
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/history', getGameHistory);

/**
 * @swagger
 * /api/game/balance:
 *   get:
 *     summary: Récupère le solde de points
 *     tags: [Jeu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Solde actuel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 points:
 *                   type: number
 *                   example: 150
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/balance', getPointsBalance);

export default router;