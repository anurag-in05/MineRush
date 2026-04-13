const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jti: { type: String, required: true, unique: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
    replacedByJti: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
