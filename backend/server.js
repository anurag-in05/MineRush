const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = 3000;

// Replace with your MongoDB connection string
const MONGODB_URI = 'mongodb+srv://anurag2005iit:IJtlKBIsrHSVggjJ@cluster0.40k0jbu.mongodb.net/';

app.use(express.json());

// --- Mongoose Schemas and Models ---     
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String, // In production, hash this!
    balance: { type: Number, default: 10000 },
    createdAt: { type: Date, default: Date.now }
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
        res.status(201).json({ message: 'User registered', userId: newUser._id });
    } catch (err) {
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
        res.json({ token, balance: user.balance });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Start Game
app.post('/game/start', authenticateToken, async (req, res) => {
    const { betAmount, mineCount } = req.body;
    try {
        const user = await User.findById(req.userId);
        if (!user || user.balance < betAmount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        user.balance -= betAmount;
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

        res.json({ gameId: newGame._id, balance: user.balance });
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
            return res.json({ result: 'mine', position });
        }
        game.grid[position] = 'safe';
        game.revealedCount += 1;
        const multiplier = calculateMultiplier(game.revealedCount, game.mineCount);
        await game.save();
        res.json({
            result: 'safe',
            position,
            multiplier: multiplier.toFixed(2),
            revealedCount: game.revealedCount
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

        user.balance += winAmount;
        await user.save();

        res.json({ winAmount, balance: user.balance });
    } catch (err) {
        res.status(500).json({ error: 'Cashout failed' });
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
