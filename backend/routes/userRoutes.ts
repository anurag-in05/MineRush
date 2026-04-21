import express, { Request, Response } from 'express';
import authenticateToken from '../middleware/authenticateToken';
import authorizeRole from '../middleware/authorizeRole';
import User from '../models/User';
import { isSameCalendarDay } from '../utils/dateUtils';

const router = express.Router();

router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      username: user.username,
      balance: user.balance,
      userId: user._id,
      role: user.role,
      totalWins: user.totalWins || 0,
      gamesPlayed: user.gamesPlayed || 0,
      dailyQuest: {
        gamesPlayed: user.dailyQuest?.gamesPlayed || 0,
        lastQuestDate: user.dailyQuest?.lastQuestDate || null,
        claimed: user.dailyQuest?.claimed || false
      },
      dayStreak: user.dayStreak || 0,
      streakMultiplier: user.streakMultiplier || 1.0
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

router.get('/admin/users', authenticateToken, authorizeRole('admin'), async (req: Request, res: Response) => {
  try {
    const users = await User.find({}, 'username role balance totalWins gamesPlayed createdAt').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/quest/claim', authenticateToken, async (req: Request, res: Response) => {
  const QUEST_GAMES_REQUIRED = 5;
  const QUEST_REWARD = 500;

  try {
    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const today = new Date();
    const questDate = user.dailyQuest.lastQuestDate ? new Date(user.dailyQuest.lastQuestDate) : null;

    if (!isSameCalendarDay(questDate, today)) {
      res.status(400).json({ error: 'No quest progress for today' });
      return;
    }

    if (user.dailyQuest.claimed) {
      res.status(400).json({ error: 'Quest already claimed' });
      return;
    }

    if (user.dailyQuest.gamesPlayed < QUEST_GAMES_REQUIRED) {
      res.status(400).json({ error: 'Quest not completed yet' });
      return;
    }

    user.balance += QUEST_REWARD;
    user.dailyQuest.claimed = true;
    await user.save();

    res.json({
      message: 'Quest reward claimed',
      balance: user.balance,
      dailyQuest: user.dailyQuest
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to claim quest reward' });
  }
});

export default router;
