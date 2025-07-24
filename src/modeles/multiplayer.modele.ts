import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMultiplayerGame extends Document {
    creator: Types.ObjectId;
    opponent?: Types.ObjectId;
    stake: number;
    timeLimit: number;
    status: 'waiting' | 'playing' | 'finished';
    creatorNumber?: number;
    opponentNumber?: number;
    winner?: Types.ObjectId;
    createdAt: Date;
    startedAt?: Date;
    finishedAt?: Date;
}

const MultiplayerGameSchema = new Schema({
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    opponent: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    stake: {
        type: Number,
        required: true,
        min: 1
    },
    timeLimit: {
        type: Number,
        required: true,
        min: 10
    },
    status: {
        type: String,
        enum: ['waiting', 'playing', 'finished'],
        default: 'waiting'
    },
    creatorNumber: { type: Number },
    opponentNumber: { type: Number },
    winner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    startedAt: { type: Date },
    finishedAt: { type: Date }
});

export const MultiplayerGame = mongoose.model<IMultiplayerGame>('MultiplayerGame', MultiplayerGameSchema);

// Utilitaire pour générer un nom de room unique pour chaque partie
export function getGameRoom(gameId: string) {
  return `game_${gameId}`;
}