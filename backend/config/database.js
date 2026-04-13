const mongoose = require('mongoose');

async function connectDatabase(mongoUri) {
    if (!mongoUri) {
        throw new Error('MONGODB_URI is not set');
    }
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
}
module.exports = { connectDatabase };
