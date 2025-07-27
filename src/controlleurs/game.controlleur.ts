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

// Map pour stocker les timers actifs par partie
const gameTimers = new Map<string, NodeJS.Timeout>();

// Fonction pour démarrer le timer d'un joueur
const startPlayerTimer = async (gameId: string, playerId: string, timeLimit: number) => {
  const timer = setTimeout(async () => {
    try {
      const game = await MultiplayerGame.findById(gameId);
      if (!game || game.status !== 'playing') return;

      // Générer un nombre aléatoire pour le joueur qui a timeout
      const randomNumber = Math.floor(Math.random() * 101);
      
      if (game.creator.toString() === playerId) {
        game.creatorNumber = randomNumber;
      } else if (game.opponent && game.opponent.toString() === playerId) {
        game.opponentNumber = randomNumber;
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

        await updateGamePoints(game);
        
        // Émettre la fin de partie
        const room = getGameRoom(gameId);
        io.to(room).emit('gameUpdate', { game, finished: true, timeout: true });
      }

      await game.save();
      gameTimers.delete(gameId);
    } catch (error) {
      console.error('Erreur dans le timer:', error);
    }
  }, timeLimit * 1000);

  gameTimers.set(gameId, timer);
};

// Fonction pour arrêter le timer d'une partie
const stopGameTimer = (gameId: string) => {
  const timer = gameTimers.get(gameId);
  if (timer) {
    clearTimeout(timer);
    gameTimers.delete(gameId);
  }
};

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

    // Démarrer le timer pour le créateur (il joue en premier)
    startPlayerTimer(gameId, game.creator.toString(), game.timeLimit);

    // Émettre l'événement de début de partie
    const room = getGameRoom(gameId);
    io.to(room).emit('gameStarted', { 
      game, 
      currentPlayer: game.creator.toString(),
      timeLimit: game.timeLimit 
    });

    res.status(200).json(new ApiResponse(200, 'Partie rejointe', game));
  } catch (error) {
    console.error('Erreur dans joinMultiplayerGame:', error);
    res.status(500).json(new ApiResponse(500, 'Erreur serveur'));
  }
};

// Jouer un tour (génération automatique du nombre)
export const playTurn = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const gameId = req.params.gameId;

    const game = await MultiplayerGame.findById(gameId);
    if (!game) return res.status(404).json(new ApiResponse(404, 'Partie non trouvée'));

    if (game.status !== 'playing') {
      return res.status(400).json(new ApiResponse(400, 'Partie non en cours'));
    }

    // Vérifier que c'est bien le tour du joueur
    const isCreatorTurn = game.creatorNumber === undefined;
    const isOpponentTurn = game.opponentNumber === undefined;
    
    if (game.creator.equals(userId) && !isCreatorTurn) {
      return res.status(400).json(new ApiResponse(400, 'Ce n\'est pas votre tour'));
    }
    
    if (game.opponent?.equals(userId) && !isOpponentTurn) {
      return res.status(400).json(new ApiResponse(400, 'Ce n\'est pas votre tour'));
    }

    // Générer le nombre automatiquement
    const randomNumber = Math.floor(Math.random() * 101);

    // Arrêter le timer actuel
    stopGameTimer(gameId);

    // Enregistrer le nombre du joueur
    if (game.creator.equals(userId)) {
      game.creatorNumber = randomNumber;
    } else if (game.opponent?.equals(userId)) {
      game.opponentNumber = randomNumber;
    } else {
      return res.status(403).json(new ApiResponse(403, 'Accès non autorisé'));
    }

    // Vérifier si la partie est terminée
    let finished = false;
    let nextPlayer = null;
    
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
    } else {
      // Déterminer le prochain joueur
      if (game.creatorNumber !== undefined && game.opponentNumber === undefined) {
        nextPlayer = game.opponent?.toString();
        // Démarrer le timer pour l'adversaire
        startPlayerTimer(gameId, nextPlayer!, game.timeLimit);
      }
    }

    await game.save();

    // Émettre l'événement de mise à jour
    const room = getGameRoom(gameId);
    io.to(room).emit('gameUpdate', { 
      game, 
      finished, 
      nextPlayer,
      lastPlayedNumber: randomNumber,
      lastPlayer: userId
    });

    res.status(200).json(new ApiResponse(200, 'Coup enregistré', {
      number: randomNumber,
      game,
      finished,
      nextPlayer
    }));
  } catch (error) {
    console.error('Erreur dans playTurn:', error);
    res.status(500).json(new ApiResponse(500, 'Erreur serveur'));
  }
};

// Obtenir l'état d'une partie
export const getGameStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const gameId = req.params.gameId;

    const game = await MultiplayerGame.findById(gameId)
      .populate('creator', 'firstName lastName')
      .populate('opponent', 'firstName lastName')
      .populate('winner', 'firstName lastName');

    if (!game) {
      return res.status(404).json(new ApiResponse(404, 'Partie non trouvée'));
    }

    // Vérifier que l'utilisateur fait partie de la partie
    if (!game.creator.equals(userId) && !game.opponent?.equals(userId)) {
      return res.status(403).json(new ApiResponse(403, 'Accès non autorisé'));
    }

    // Déterminer le joueur actuel
    let currentPlayer = null;
    if (game.status === 'playing') {
      if (game.creatorNumber === undefined) {
        currentPlayer = game.creator.toString();
      } else if (game.opponentNumber === undefined) {
        currentPlayer = game.opponent?.toString();
      }
    }

    // Calculer le temps restant si la partie est en cours
    let timeRemaining = null;
    if (game.status === 'playing' && game.startedAt && currentPlayer) {
      const elapsed = Date.now() - game.startedAt.getTime();
      timeRemaining = Math.max(0, game.timeLimit - Math.floor(elapsed / 1000));
    }

    const response = {
      game,
      currentPlayer,
      timeRemaining,
      isMyTurn: currentPlayer === userId,
      gameState: {
        creatorPlayed: game.creatorNumber !== undefined,
        opponentPlayed: game.opponentNumber !== undefined,
        finished: game.status === 'finished'
      }
    };

    res.status(200).json(new ApiResponse(200, 'État de la partie récupéré', response));
  } catch (error) {
    console.error('Erreur dans getGameStatus:', error);
    res.status(500).json(new ApiResponse(500, 'Erreur serveur'));
  }
};

// Obtenir l'historique des parties multijoueur
export const getMultiplayerHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Récupération des parties multijoueur avec pagination
    const [games, totalGames] = await Promise.all([
      Game.find({ 
        userId, 
        gameType: 'multiplayer' 
      })
        .populate('multiplayerGame')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Game.countDocuments({ 
        userId, 
        gameType: 'multiplayer' 
      })
    ]);

    const response = new ApiResponse(
      200,
      'Historique multijoueur récupéré avec succès',
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
    console.error('Erreur dans getMultiplayerHistory:', error);
    res.status(500).json(
      new ApiResponse(500, 'Erreur lors de la récupération de l\'historique multijoueur')
    );
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

  // Récupérer les nouveaux soldes
  const [winner, loser] = await Promise.all([
    User.findById(winnerId),
    User.findById(loserId)
  ]);

  // Historique des parties multijoueur
  await Game.create([
    {
      userId: winnerId,
      number: isCreatorWinner ? game.creatorNumber : game.opponentNumber,
      result: 'win',
      pointsChange: stake,
      balanceAfter: winner!.points,
      gameType: 'multiplayer',
      multiplayerGame: game._id
    },
    {
      userId: loserId,
      number: isCreatorWinner ? game.opponentNumber : game.creatorNumber,
      result: 'lose',
      pointsChange: -stake,
      balanceAfter: loser!.points,
      gameType: 'multiplayer',
      multiplayerGame: game._id
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

    // Jouer un tour (génération automatique)
    socket.on('playTurn', async ({ gameId }: { gameId: string }) => {
      const game = await MultiplayerGame.findById(gameId);
      if (!game) {
        socket.emit('error', { message: 'Partie non trouvée' });
        return;
      }

      const userId = user._id.toString();
      
      // Vérifier que c'est bien le tour du joueur
      const isCreatorTurn = game.creatorNumber === undefined;
      const isOpponentTurn = game.opponentNumber === undefined;
      
      if (game.creator.toString() === userId && !isCreatorTurn) {
        socket.emit('error', { message: 'Ce n\'est pas votre tour' });
        return;
      }
      
      if (game.opponent && game.opponent.toString() === userId && !isOpponentTurn) {
        socket.emit('error', { message: 'Ce n\'est pas votre tour' });
        return;
      }

      // Générer le nombre automatiquement
      const randomNumber = Math.floor(Math.random() * 101);

      // Arrêter le timer actuel
      stopGameTimer(gameId);

      // Enregistrer le nombre du joueur
      if (game.creator.toString() === userId) {
        game.creatorNumber = randomNumber;
      } else if (game.opponent && game.opponent.toString() === userId) {
        game.opponentNumber = randomNumber;
      } else {
        socket.emit('error', { message: 'Accès non autorisé' });
        return;
      }

      // Vérifier si la partie est terminée
      let finished = false;
      let nextPlayer = null;
      
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
      } else {
        // Déterminer le prochain joueur
        if (game.creatorNumber !== undefined && game.opponentNumber === undefined) {
          nextPlayer = game.opponent?.toString();
          // Démarrer le timer pour l'adversaire
          startPlayerTimer(gameId, nextPlayer!, game.timeLimit);
        }
      }

      await game.save();

      // Émettre l'état du jeu à la room
      const room = getGameRoom(gameId);
      io.to(room).emit('gameUpdate', { 
        game, 
        finished, 
        nextPlayer,
        lastPlayedNumber: randomNumber,
        lastPlayer: userId
      });
    });

    // Quitter la room
    socket.on('leaveGameRoom', ({ gameId }: { gameId: string }) => {
      const room = getGameRoom(gameId);
      socket.leave(room);
    });

    // Nettoyer les timers lors de la déconnexion
    socket.on('disconnect', () => {
      // Arrêter tous les timers de cet utilisateur
      for (const [gameId, timer] of gameTimers.entries()) {
        clearTimeout(timer);
        gameTimers.delete(gameId);
      }
    });
  });
}