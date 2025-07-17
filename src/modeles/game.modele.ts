import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface et Modèle pour les parties de jeu
export interface IGame extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  number: number;
  result: 'win' | 'lose';
  pointsChange: number;
  balanceAfter: number;
  createdAt: Date;
}

const GameSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  number: { 
    type: Number, 
    required: true 
  },
  result: { 
    type: String, 
    enum: ['win', 'lose'], 
    required: true 
  },
  pointsChange: { 
    type: Number, 
    required: true 
  },
  balanceAfter: { 
    type: Number, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export const Game = mongoose.model<IGame>('Game', GameSchema);