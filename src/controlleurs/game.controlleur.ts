import { Request, Response } from 'express';
import mongoose, { Document, Schema, Types } from 'mongoose';
import User from '../modeles/utilisateur.modele';
import { Game } from '../modeles/game.modele';
import { ApiResponse } from '../utilitaires/reponseApi';

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