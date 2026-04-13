const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    betAmount: { type: Number, required: true, min: 0.01 },
    mineCount: { type: Number, required: true, min: 1, max: 24 },
    grid: {
        type: [{ type: String, enum: ['hidden', 'mine', 'safe'] }],
        validate: {
            validator(value) {
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
            validator(value) {
                return Array.isArray(value) && value.length <= 24;
            },
            message: 'Mines must contain at most 24 positions'
        }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', gameSchema);
