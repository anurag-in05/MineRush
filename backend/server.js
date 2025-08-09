const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
app.use(cors());
const PORT = 3000;

require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json());

// --- Mongoose Schemas and Models ---

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String, 
    balance: { type: Number, default: 10000 },
    totalWins: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 }, 
    createdAt: { type: Date, default: Date.now },
    dailyQuest: {
        gamesPlayed: { type: Number, default: 0 },
        lastQuestDate: { type: Date, default: null },
        claimed: { type: Boolean, default: false }
    },
    dayStreak: { type: Number, default: 0 },
    lastPlayedDate: { type: Date, default: null },
    streakMultiplier: { type: Number, default: 1.0 }
});

const gameSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    betAmount: Number,
    mineCount: Number,
    grid: [String], // 'hidden', 'mine', 'safe'
    revealedCount: Number,
    gameOver: Boolean,
    winAmount: Number,
    mines: [Number],
    createdAt: { type: Date, default: Date.now }
});

const tokenSchema = new mongoose.Schema({
    token: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Game = mongoose.model('Game', gameSchema);
const Token = mongoose.model('Token', tokenSchema);

// --- Helper Functions ---

function generateToken(userId) {
    return `vt_${Date.now()}_${userId}`;
}

function generateMines(mineCount) {
    const positions = [...Array(25).keys()];
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    return positions.slice(0, mineCount);
}

function calculateMultiplier(revealedCount, mineCount) {
    let probability = 1;
    for (let i = 0; i < revealedCount; i++) {
        probability *= (25 - mineCount - i) / (25 - i);
    }
    return 0.98 / probability;
}

// --- Middleware ---
async function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const tokenDoc = await Token.findOne({ token });
    if (!tokenDoc) return res.status(401).json({ error: 'Invalid token' });
    req.userId = tokenDoc.userId;
    next();
}

// --- Routes ---
// Register
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const exists = await User.findOne({ username });
        if (exists) return res.status(400).json({ error: 'Username already exists' });

        const newUser = new User({ username, password });
        await newUser.save();
        // Auto-login after register
        const token = generateToken(newUser._id);
        await new Token({ token, userId: newUser._id }).save();
        res.status(201).json({
            message: 'User registered',
            token,
            user: { username: newUser.username, balance: newUser.balance, userId: newUser._id }
        });
    } catch (err) {
        console.error('Registration error:', err);
        if (err.code === 11000) {
            // Duplicate key error (username already exists)
            return res.status(400).json({ error: 'Username already exists' });
        }
        if (err.message) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const token = generateToken(user._id);
        await new Token({ token, userId: user._id }).save();
        res.json({
            token,
            user: { username: user.username, balance: user.balance, userId: user._id }
        });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Start Game
app.post('/game/start', authenticateToken, async (req, res) => {
    const { betAmount, mineCount } = req.body;
    const game = await Game.findOne({ userId: req.userId, gameOver: false }).sort({ createdAt: -1 });
    try {
        const user = await User.findById(req.userId);
        if (!user || user.balance < betAmount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        user.balance -= betAmount;
        // Remove games played increment from game start

        // --- Day Streak Logic ---
        const today = new Date();
        const lastPlayed = user.lastPlayedDate ? new Date(user.lastPlayedDate) : null;
        const isPlayedToday = lastPlayed && lastPlayed.getFullYear() === today.getFullYear() && lastPlayed.getMonth() === today.getMonth() && lastPlayed.getDate() === today.getDate();
        const isPlayedYesterday = lastPlayed && ((today - lastPlayed) / (1000 * 60 * 60 * 24) === 1);
        if (isPlayedToday) {
            // Already played today, streak unchanged
        } else if (isPlayedYesterday) {
            user.dayStreak = (user.dayStreak || 0) + 1;
        } else {
            user.dayStreak = 1;
        }
        user.lastPlayedDate = today;
        // --- Multiplier Logic ---
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
            multiplier: multiplier,
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

// Reveal Tile
app.post('/game/reveal', authenticateToken, async (req, res) => {
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
            // Increment games played and daily quest on loss
            const user = await User.findById(req.userId);
            user.gamesPlayed = (user.gamesPlayed || 0) + 1;
            const today = new Date();
            const questDate = user.dailyQuest.lastQuestDate ? new Date(user.dailyQuest.lastQuestDate) : null;
            const isSameDay = questDate && questDate.getFullYear() === today.getFullYear() && questDate.getMonth() === today.getMonth() && questDate.getDate() === today.getDate();
            if (!isSameDay) {
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

// Cash Out
app.post('/game/cashout', authenticateToken, async (req, res) => {
    const { gameId } = req.body;
    try{
        const game = await Game.findById(gameId);
        const user = await User.findById(req.userId);
        // Only increment after confirming valid game and gameOver

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

        // Now increment games played and daily quest
        user.gamesPlayed = (user.gamesPlayed || 0) + 1;
        // --- Daily Quest Progress ---
        const today = new Date();
        const questDate = user.dailyQuest.lastQuestDate ? new Date(user.dailyQuest.lastQuestDate) : null;
        const isSameDay = questDate && questDate.getFullYear() === today.getFullYear() && questDate.getMonth() === today.getMonth() && questDate.getDate() === today.getDate();
        if (!isSameDay) {
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
// Get user info
app.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({
            username: user.username,
            balance: user.balance,
            userId: user._id,
            totalWins: user.totalWins || 0,
            gamesPlayed: user.gamesPlayed || 0, // <-- Add this line
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
// --- Daily Quest Reward Endpoint ---
// Example: POST /quest/claim
app.post('/quest/claim', authenticateToken, async (req, res) => {
    // Define quest requirement and reward
    const QUEST_GAMES_REQUIRED = 5;
    const QUEST_REWARD = 500; // tokens
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        const today = new Date();
        const questDate = user.dailyQuest.lastQuestDate ? new Date(user.dailyQuest.lastQuestDate) : null;
        const isSameDay = questDate && questDate.getFullYear() === today.getFullYear() && questDate.getMonth() === today.getMonth() && questDate.getDate() === today.getDate();
        if (!isSameDay) {
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
        res.json({ message: 'Quest reward claimed', balance: user.balance, dailyQuest: user.dailyQuest });
    } catch (err) {
        res.status(500).json({ error: 'Failed to claim quest reward' });
    }
});
});

// Get current game state
app.get('/game/state', authenticateToken, async (req, res) => {
    try {
        const game = await Game.findOne({ userId: req.userId, gameOver: false }).sort({ createdAt: -1 });
        if (!game) {
            // Always return a valid response for no active game
            return res.json({ game: null });
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

// --- Connect to MongoDB and Start Server ---
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });
