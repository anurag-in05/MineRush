const express = require('express');

const authenticateToken = require('../middleware/authenticateToken');
const validateBody = require('../middleware/validateBody');
const Game = require('../models/Game');
const User = require('../models/User');
const { isPreviousCalendarDay, isSameCalendarDay } = require('../utils/dateUtils');
const { calculateMultiplier, generateMines } = require('../utils/gameUtils');
const { cashoutSchema, revealTileSchema, startGameSchema } = require('../utils/validationSchemas');

const router = express.Router();

router.post('/game/start', authenticateToken, validateBody(startGameSchema), async (req, res) => {
    const { betAmount, mineCount } = req.body;

    try {
        const user = await User.findById(req.userId);

        if (!user || user.balance < betAmount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        user.balance -= betAmount;

        const today = new Date();
        const lastPlayed = user.lastPlayedDate ? new Date(user.lastPlayedDate) : null;

        if (isSameCalendarDay(lastPlayed, today)) {
            // Keep current streak when user already played today.
        } else if (isPreviousCalendarDay(lastPlayed, today)) {
            user.dayStreak = (user.dayStreak || 0) + 1;
        } else {
            user.dayStreak = 1;
        }

        user.lastPlayedDate = today;
        user.streakMultiplier = 1 + 0.1 * user.dayStreak;
        await user.save();

        const mines = generateMines(mineCount);
        const newGame = new Game({
            userId: user._id,
            betAmount,
            mineCount,
            grid: Array(25).fill('hidden'),
            revealedCount: 0,
            gameOver: false,
            winAmount: 0,
            mines
        });
        await newGame.save();

        const multiplier = calculateMultiplier(newGame.revealedCount, newGame.mineCount);

        return res.json({
            gameId: newGame._id,
            balance: user.balance,
            multiplier,
            game: {
                grid: newGame.grid,
                revealedCount: newGame.revealedCount,
                gameOver: newGame.gameOver,
                winAmount: newGame.winAmount,
                mines: newGame.mines,
                betAmount: newGame.betAmount,
                mineCount: newGame.mineCount
            },
            dailyQuest: user.dailyQuest
        });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to start game' });
    }
});

router.post('/game/reveal', authenticateToken, validateBody(revealTileSchema), async (req, res) => {
    const { gameId, position } = req.body;

    try {
        const game = await Game.findById(gameId);

        if (!game || !game.userId.equals(req.userId) || game.gameOver) {
            return res.status(400).json({ error: 'Invalid game' });
        }

        if (game.grid[position] !== 'hidden') {
            return res.status(400).json({ error: 'Invalid move' });
        }

        if (game.mines.includes(position)) {
            game.grid[position] = 'mine';
            game.gameOver = true;
            await game.save();

            const user = await User.findById(req.userId);
            user.gamesPlayed = (user.gamesPlayed || 0) + 1;

            const today = new Date();
            const questDate = user.dailyQuest.lastQuestDate ? new Date(user.dailyQuest.lastQuestDate) : null;

            if (!isSameCalendarDay(questDate, today)) {
                user.dailyQuest.gamesPlayed = 1;
                user.dailyQuest.lastQuestDate = today;
                user.dailyQuest.claimed = false;
            } else {
                user.dailyQuest.gamesPlayed += 1;
            }

            await user.save();

            return res.json({
                result: 'mine',
                position,
                grid: game.grid,
                gameOver: true,
                mines: game.mines
            });
        }

        game.grid[position] = 'safe';
        game.revealedCount += 1;
        const multiplier = calculateMultiplier(game.revealedCount, game.mineCount);
        await game.save();

        return res.json({
            result: 'safe',
            position,
            multiplier: multiplier.toFixed(2),
            revealedCount: game.revealedCount,
            grid: game.grid,
            gameOver: false
        });
    } catch (err) {
        return res.status(500).json({ error: 'Reveal failed' });
    }
});

router.post('/game/cashout', authenticateToken, validateBody(cashoutSchema), async (req, res) => {
    const { gameId } = req.body;

    try {
        const game = await Game.findById(gameId);
        const user = await User.findById(req.userId);

        if (!game || !user || !game.userId.equals(req.userId) || game.gameOver) {
            return res.status(400).json({ error: 'Invalid game' });
        }

        if (game.revealedCount === 0) {
            return res.status(400).json({ error: 'Cannot cash out' });
        }

        const multiplier = calculateMultiplier(game.revealedCount, game.mineCount);
        const winAmount = game.betAmount * multiplier;

        game.winAmount = winAmount;
        game.gameOver = true;
        await game.save();

        user.gamesPlayed = (user.gamesPlayed || 0) + 1;

        const today = new Date();
        const questDate = user.dailyQuest.lastQuestDate ? new Date(user.dailyQuest.lastQuestDate) : null;

        if (!isSameCalendarDay(questDate, today)) {
            user.dailyQuest.gamesPlayed = 1;
            user.dailyQuest.lastQuestDate = today;
            user.dailyQuest.claimed = false;
        } else {
            user.dailyQuest.gamesPlayed += 1;
        }

        user.balance += winAmount;
        user.totalWins = (user.totalWins || 0) + 1;
        await user.save();

        return res.json({
            winAmount,
            multiplier,
            balance: user.balance,
            game: {
                grid: game.grid,
                revealedCount: game.revealedCount,
                gameOver: game.gameOver,
                winAmount: game.winAmount,
                mines: game.mines,
                betAmount: game.betAmount,
                mineCount: game.mineCount
            }
        });
    } catch (err) {
        return res.status(500).json({ error: 'Cashout failed' });
    }
});

router.get('/game/state', authenticateToken, async (req, res) => {
    try {
        const game = await Game.findOne({ userId: req.userId, gameOver: false }).sort({ createdAt: -1 });

        if (!game) {
            return res.json({ game: null });
        }

        return res.json({
            gameId: game._id,
            grid: game.grid,
            revealedCount: game.revealedCount,
            gameOver: game.gameOver,
            winAmount: game.winAmount,
            mines: game.mines,
            betAmount: game.betAmount,
            mineCount: game.mineCount
        });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch game state' });
    }
});

module.exports = router;
