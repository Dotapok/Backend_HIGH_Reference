import { Router } from 'express';
import { protect } from '../middlewares/authentification.md';
import { 
  playGame,
  getGameHistory,
  getPointsBalance,
  createMultiplayerGame,
  listWaitingGames,
  joinMultiplayerGame,
  playTurn,
  getGameStatus,
  getMultiplayerHistory
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

/**
 * @swagger
 * /api/game/multiplayer:
 *   post:
 *     summary: Créer une partie multijoueur
 *     tags: [Jeu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stake:
 *                 type: number
 *                 example: 50
 *               timeLimit:
 *                 type: number
 *                 example: 60
 *     responses:
 *       201:
 *         description: Partie créée
 */
router.post('/multiplayer', createMultiplayerGame);

/**
 * @swagger
 * /api/game/multiplayer/waiting:
 *   get:
 *     summary: Lister les parties en attente
 *     tags: [Jeu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des parties
 */
router.get('/multiplayer/waiting', listWaitingGames);

/**
 * @swagger
 * /api/game/multiplayer/join/{gameId}:
 *   post:
 *     summary: Rejoindre une partie
 *     tags: [Jeu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Partie rejointe
 */
router.post('/multiplayer/join/:gameId', joinMultiplayerGame);

/**
 * @swagger
 * /api/game/multiplayer/status/{gameId}:
 *   get:
 *     summary: Obtenir l'état d'une partie multijoueur
 *     tags: [Jeu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: État de la partie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 game:
 *                   type: object
 *                   description: Détails de la partie
 *                 currentPlayer:
 *                   type: string
 *                   description: ID du joueur actuel
 *                 timeRemaining:
 *                   type: number
 *                   description: Temps restant en secondes
 *                 isMyTurn:
 *                   type: boolean
 *                   description: Si c'est le tour de l'utilisateur
 *                 gameState:
 *                   type: object
 *                   description: État du jeu
 */
router.get('/multiplayer/status/:gameId', getGameStatus);

/**
 * @swagger
 * /api/game/multiplayer/play/{gameId}:
 *   post:
 *     summary: Jouer un tour (génération automatique du nombre)
 *     tags: [Jeu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coup enregistré avec nombre généré automatiquement
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 number:
 *                   type: number
 *                   description: Nombre généré automatiquement (0-100)
 *                   example: 75
 *                 finished:
 *                   type: boolean
 *                   description: Si la partie est terminée
 *                 nextPlayer:
 *                   type: string
 *                   description: ID du prochain joueur (si partie non terminée)
 */
router.post('/multiplayer/play/:gameId', playTurn);

/**
 * @swagger
 * /api/game/multiplayer/history:
 *   get:
 *     summary: Récupère l'historique des parties multijoueur
 *     tags: [Jeu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Historique des parties multijoueur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 games:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       number:
 *                         type: number
 *                       result:
 *                         type: string
 *                         enum: [win, lose]
 *                       pointsChange:
 *                         type: number
 *                       gameType:
 *                         type: string
 *                         enum: [multiplayer]
 *                       multiplayerGame:
 *                         type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     pages:
 *                       type: number
 *                     limit:
 *                       type: number
 */
router.get('/multiplayer/history', getMultiplayerHistory);

export default router;