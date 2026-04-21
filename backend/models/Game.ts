import { Schema, model, Document, Types } from 'mongoose';

export interface IGame extends Document {
  userId: Types.ObjectId;
  betAmount: number;
  mineCount: number;
  grid: Array<'hidden' | 'mine' | 'safe'>;
  revealedCount: number;
  gameOver: boolean;
  winAmount: number;
  mines: number[];
  createdAt: Date;
}

const gameSchema = new Schema<IGame>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  betAmount: { type: Number, required: true, min: 0.01 },
  mineCount: { type: Number, required: true, min: 1, max: 24 },
  grid: {
    type: [{ type: String, enum: ['hidden', 'mine', 'safe'] }],
    validate: {
      validator(value: string[]) {
        return Array.isArray(value) && value.length === 25;
      },
      message: 'Grid must contain exactly 25 cells'
    }
  },
  revealedCount: { type: Number, default: 0, min: 0, max: 25 },
  gameOver: { type: Boolean, default: false },
  winAmount: { type: Number, default: 0, min: 0 },
  mines: {
    type: [{ type: Number, min: 0, max: 24 }],
    validate: {
      validator(value: number[]) {
        return Array.isArray(value) && value.length <= 24;
      },
      message: 'Mines must contain at most 24 positions'
    }
  },
  createdAt: { type: Date, default: Date.now }
});

export default model<IGame>('Game', gameSchema);
