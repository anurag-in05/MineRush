const express = require('express');

const authenticateToken = require('../middleware/authenticateToken');
const authorizeRole = require('../middleware/authorizeRole');
const User = require('../models/User');
const { isSameCalendarDay } = require('../utils/dateUtils');

const router = express.Router();

router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json({
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
        return res.status(500).json({ error: 'Failed to fetch user info' });
    }
});

router.get('/admin/users', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const users = await User.find({}, 'username role balance totalWins gamesPlayed createdAt').sort({ createdAt: -1 });
        return res.json({ users });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.post('/quest/claim', authenticateToken, async (req, res) => {
    const QUEST_GAMES_REQUIRED = 5;
    const QUEST_REWARD = 500;

    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const today = new Date();
        const questDate = user.dailyQuest.lastQuestDate ? new Date(user.dailyQuest.lastQuestDate) : null;

        if (!isSameCalendarDay(questDate, today)) {
            return res.status(400).json({ error: 'No quest progress for today' });
        }

        if (user.dailyQuest.claimed) {
            return res.status(400).json({ error: 'Quest already claimed' });
        }

        if (user.dailyQuest.gamesPlayed < QUEST_GAMES_REQUIRED) {
            return res.status(400).json({ error: 'Quest not completed yet' });
        }

        user.balance += QUEST_REWARD;
        user.dailyQuest.claimed = true;
        await user.save();

        return res.json({
            message: 'Quest reward claimed',
            balance: user.balance,
            dailyQuest: user.dailyQuest
        });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to claim quest reward' });
    }
});

module.exports = router;
