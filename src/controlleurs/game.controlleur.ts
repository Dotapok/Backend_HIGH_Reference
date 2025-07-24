import { Request, Response } from 'express';
import mongoose, { Document, Schema, Types } from 'mongoose';
import User from '../modeles/utilisateur.modele';
import { Game } from '../modeles/game.modele';
import { MultiplayerGame, IMultiplayerGame, getGameRoom } from '../modeles/multiplayer.modele';
import { ApiResponse } from '../utilitaires/reponseApi';
import { io } from '../serveur';

// Custom request type that includes user property
interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    [key: string]: any;
  };
}

// Contrôleur pour jouer une partie
export const playGame = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json(new ApiResponse(404, 'Utilisateur non trouvé'));
    }

    // Génération du nombre aléatoire et détermination du résultat
    const randomNumber = Math.floor(Math.random() * 101);
    const isWin = randomNumber > 70;
    const result: 'win' | 'lose' = isWin ? 'win' : 'lose';
    const pointsChange = isWin ? 50 : -35;

    // Mise à jour des points de l'utilisateur
    user.points += pointsChange;
    await user.save();

    // Création et sauvegarde de la partie
    const game = new Game({
      userId: user._id,
      number: randomNumber,
      result,
      pointsChange,
      balanceAfter: user.points
    });
    await game.save();

    const response = new ApiResponse(
      200,
      'Partie terminée avec succès',
      {
        gameId: game._id,
        number: game.number,
        result: game.result,
        pointsChange: game.pointsChange,
        newBalance: game.balanceAfter,
        createdAt: game.createdAt
      }
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Erreur dans playGame:', error);
    res.status(500).json(
      new ApiResponse(500, 'Erreur lors du traitement de la partie')
    );
  }
};

// Contrôleur pour récupérer l'historique des parties
export const getGameHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Récupération des parties avec pagination
    const [games, totalGames] = await Promise.all([
      Game.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Game.countDocuments({ userId })
    ]);

    const response = new ApiResponse(
      200,
      'Historique récupéré avec succès',
      {
        games,
        pagination: {
          total: totalGames,
          page,
          pages: Math.ceil(totalGames / limit),
          limit
        }
      }
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Erreur dans getGameHistory:', error);
    res.status(500).json(
      new ApiResponse(500, 'Erreur lors de la récupération de l\'historique')
    );
  }
};

// Contrôleur pour récupérer le solde de points
export const getPointsBalance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId).select('points');

    if (!user) {
      return res.status(404).json(
        new ApiResponse(404, 'Utilisateur non trouvé')
      );
    }

    const response = new ApiResponse(
      200,
      'Solde récupéré avec succès',
      { points: user.points }
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Erreur dans getPointsBalance:', error);
    res.status(500).json(
      new ApiResponse(500, 'Erreur lors de la récupération du solde')
    );
  }
};

// Créer une partie multijoueur
export const createMultiplayerGame = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { stake, timeLimit } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, 'Utilisateur non trouvé'));
    }

    if (user.points < stake) {
      return res.status(400).json(new ApiResponse(400, 'Solde insuffisant'));
    }

    const newGame = new MultiplayerGame({
      creator: userId,
      stake,
      timeLimit,
      status: 'waiting'
    });

    await newGame.save();

    res.status(201).json(new ApiResponse(201, 'Partie créée', newGame));
  } catch (error) {
    console.error('Erreur dans createMultiplayerGame:', error);
    res.status(500).json(new ApiResponse(500, 'Erreur lors de la création de la partie'));
  }
};

// Lister les parties en attente
export const listWaitingGames = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const games = await MultiplayerGame.find({ status: 'waiting' })
      .populate('creator', 'firstName lastName points')
      .lean();

    res.status(200).json(new ApiResponse(200, 'Parties en attente', games));
  } catch (error) {
    console.error('Erreur dans listWaitingGames:', error);
    res.status(500).json(new ApiResponse(500, 'Erreur serveur'));
  }
};

// Rejoindre une partie
export const joinMultiplayerGame = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const gameId = req.params.gameId;

    const user = await User.findById(userId);
    const game = await MultiplayerGame.findById(gameId);

    if (!user || !game) {
      return res.status(404).json(new ApiResponse(404, 'Ressource non trouvée'));
    }

    if (game.status !== 'waiting') {
      return res.status(400).json(new ApiResponse(400, 'Partie non disponible'));
    }

    if (user.points < game.stake) {
      return res.status(400).json(new ApiResponse(400, 'Solde insuffisant'));
    }

    game.opponent = new mongoose.Types.ObjectId(userId);
    game.status = 'playing';
    game.startedAt = new Date();

    await game.save();

    res.status(200).json(new ApiResponse(200, 'Partie rejointe', game));
  } catch (error) {
    console.error('Erreur dans joinMultiplayerGame:', error);
    res.status(500).json(new ApiResponse(500, 'Erreur serveur'));
  }
};

// Jouer un tour
export const playTurn = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const gameId = req.params.gameId;
    const { number } = req.body;

    const game = await MultiplayerGame.findById(gameId);
    if (!game) return res.status(404).json(new ApiResponse(404, 'Partie non trouvée'));

    // Vérifier le rôle du joueur
    if (game.creator.equals(userId)) {
      game.creatorNumber = number;
    } else if (game.opponent?.equals(userId)) {
      game.opponentNumber = number;
    } else {
      return res.status(403).json(new ApiResponse(403, 'Accès non autorisé'));
    }

    // Vérifier si la partie est terminée
    if (game.creatorNumber !== undefined && game.opponentNumber !== undefined) {
      game.status = 'finished';
      game.finishedAt = new Date();

      if (game.creatorNumber > game.opponentNumber) {
        game.winner = game.creator;
      } else if (game.opponentNumber > game.creatorNumber) {
        game.winner = game.opponent;
      }

      // Mettre à jour les points
      await updateGamePoints(game);
    }

    await game.save();
    res.status(200).json(new ApiResponse(200, 'Coup enregistré', game));
  } catch (error) {
    console.error('Erreur dans playTurn:', error);
    res.status(500).json(new ApiResponse(500, 'Erreur serveur'));
  }
};

// Helper: Mettre à jour les points
const updateGamePoints = async (game: IMultiplayerGame) => {
  if (!game.winner) return; // Égalité

  const winnerId = game.winner;
  const isCreatorWinner = winnerId.equals(game.creator);
  const stake = game.stake;

  // Mettre à jour le gagnant
  await User.findByIdAndUpdate(winnerId, {
    $inc: { points: stake }
  });

  // Mettre à jour le perdant
  const loserId = isCreatorWinner ? game.opponent : game.creator;
  await User.findByIdAndUpdate(loserId, {
    $inc: { points: -stake }
  });

  // Historique des parties
  await Game.create([
    {
      userId: winnerId,
      number: isCreatorWinner ? game.creatorNumber : game.opponentNumber,
      result: 'win',
      pointsChange: stake,
      balanceAfter: (await User.findById(winnerId))!.points + stake
    },
    {
      userId: loserId,
      number: isCreatorWinner ? game.opponentNumber : game.creatorNumber,
      result: 'lose',
      pointsChange: -stake,
      balanceAfter: (await User.findById(loserId))!.points - stake
    }
  ]);
};

// Gestionnaire d'événements Socket.IO pour le jeu multijoueur
export function registerMultiplayerGameSocketHandlers() {
  io.on('connection', (socket: any) => {
    const user = socket.user;
    if (!user) return;

    // Rejoindre une room de partie
    socket.on('joinGameRoom', async ({ gameId }: { gameId: string }) => {
      const room = getGameRoom(gameId);
      socket.join(room);
      socket.emit('joinedRoom', { room });
    });

    // Jouer un tour (en temps réel)
    socket.on('playTurn', async ({ gameId, number }: { gameId: string; number: number }) => {
      const game = await MultiplayerGame.findById(gameId);
      if (!game) {
        socket.emit('error', { message: 'Partie non trouvée' });
        return;
      }
      // Vérifier le rôle du joueur
      const userId = user._id.toString();
      if (game.creator.toString() === userId) {
        game.creatorNumber = number;
      } else if (game.opponent && game.opponent.toString() === userId) {
        game.opponentNumber = number;
      } else {
        socket.emit('error', { message: 'Accès non autorisé' });
        return;
      }
      // Vérifier si la partie est terminée
      let finished = false;
      if (game.creatorNumber !== undefined && game.opponentNumber !== undefined) {
        game.status = 'finished';
        game.finishedAt = new Date();
        if (game.creatorNumber > game.opponentNumber) {
          game.winner = game.creator;
        } else if (game.opponentNumber > game.creatorNumber) {
          game.winner = game.opponent;
        }
        await updateGamePoints(game);
        finished = true;
      }
      await game.save();
      // Émettre l'état du jeu à la room
      const room = getGameRoom(gameId);
      io.to(room).emit('gameUpdate', { game, finished });
    });

    // Quitter la room
    socket.on('leaveGameRoom', ({ gameId }: { gameId: string }) => {
      const room = getGameRoom(gameId);
      socket.leave(room);
    });
  });
}