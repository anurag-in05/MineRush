import express, { Request, Response } from 'express';
import { z } from 'zod';
import authenticateToken from '../middleware/authenticateToken';
import validateBody from '../middleware/validateBody';
import Game from '../models/Game';
import User from '../models/User';
import { isPreviousCalendarDay, isSameCalendarDay } from '../utils/dateUtils';
import { calculateMultiplier, generateMines } from '../utils/gameUtils';
import { cashoutSchema, revealTileSchema, startGameSchema } from '../utils/validationSchemas';

const router = express.Router();

router.post('/game/start', authenticateToken, validateBody(startGameSchema), async (req: Request, res: Response) => {
  const { betAmount, mineCount } = req.body as z.infer<typeof startGameSchema>;

  try {
    const user = await User.findById(req.userId);

    if (!user || user.balance < betAmount) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
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

    res.json({
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
    res.status(500).json({ error: 'Failed to start game' });
  }
});

router.post('/game/reveal', authenticateToken, validateBody(revealTileSchema), async (req: Request, res: Response) => {
  const { gameId, position } = req.body as z.infer<typeof revealTileSchema>;

  try {
    const game = await Game.findById(gameId);

    if (!game || !game.userId.equals(req.userId) || game.gameOver) {
      res.status(400).json({ error: 'Invalid game' });
      return;
    }

    if (game.grid[position] !== 'hidden') {
      res.status(400).json({ error: 'Invalid move' });
      return;
    }

    if (game.mines.includes(position)) {
      game.grid[position] = 'mine';
      game.gameOver = true;
      await game.save();

      const user = await User.findById(req.userId);
      if (user) {
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
      }

      res.json({
        result: 'mine',
        position,
        grid: game.grid,
        gameOver: true,
        mines: game.mines
      });
      return;
    }

    game.grid[position] = 'safe';
    game.revealedCount += 1;
    const multiplier = calculateMultiplier(game.revealedCount, game.mineCount);
    await game.save();

    res.json({
      result: 'safe',
      position,
      multiplier: multiplier.toFixed(2),
      revealedCount: game.revealedCount,
      grid: game.grid,
      gameOver: false
    });
  } catch (err) {
    res.status(500).json({ error: 'Reveal failed' });
  }
});

router.post('/game/cashout', authenticateToken, validateBody(cashoutSchema), async (req: Request, res: Response) => {
  const { gameId } = req.body as z.infer<typeof cashoutSchema>;

  try {
    const game = await Game.findById(gameId);
    const user = await User.findById(req.userId);

    if (!game || !user || !game.userId.equals(req.userId) || game.gameOver) {
      res.status(400).json({ error: 'Invalid game' });
      return;
    }

    if (game.revealedCount === 0) {
      res.status(400).json({ error: 'Cannot cash out' });
      return;
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

    res.json({
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
    res.status(500).json({ error: 'Cashout failed' });
  }
});

router.get('/game/state', authenticateToken, async (req: Request, res: Response) => {
  try {
    const game = await Game.findOne({ userId: req.userId, gameOver: false }).sort({ createdAt: -1 });

    if (!game) {
      res.json({ game: null });
      return;
    }

    res.json({
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
    res.status(500).json({ error: 'Failed to fetch game state' });
  }
});

export default router;
