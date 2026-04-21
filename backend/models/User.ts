import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password: string;
  role: 'user' | 'admin';
  balance: number;
  totalWins: number;
  gamesPlayed: number;
  failedLoginAttempts: number;
  lockUntil: Date | null;
  createdAt: Date;
  dailyQuest: {
    gamesPlayed: number;
    lastQuestDate: Date | null;
    claimed: boolean;
  };
  dayStreak: number;
  lastPlayedDate: Date | null;
  streakMultiplier: number;
}

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{10,128}$/;

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 32,
    match: /^[a-zA-Z0-9_]+$/
  },
  password: {
    type: String,
    required: true,
    validate: {
      validator(value: string) {
        return /^\$2[aby]\$\d{2}\$.{53}$/.test(value) || strongPasswordRegex.test(value);
      },
      message: 'Password does not satisfy policy requirements'
    }
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  balance: { type: Number, default: 10000, min: 0 },
  totalWins: { type: Number, default: 0, min: 0 },
  gamesPlayed: { type: Number, default: 0, min: 0 },
  failedLoginAttempts: { type: Number, default: 0, min: 0 },
  lockUntil: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  dailyQuest: {
    gamesPlayed: { type: Number, default: 0, min: 0 },
    lastQuestDate: { type: Date, default: null },
    claimed: { type: Boolean, default: false }
  },
  dayStreak: { type: Number, default: 0, min: 0 },
  lastPlayedDate: { type: Date, default: null },
  streakMultiplier: { type: Number, default: 1.0, min: 1.0 }
});

export default model<IUser>('User', userSchema);
