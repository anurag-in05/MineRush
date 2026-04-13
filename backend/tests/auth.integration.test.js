const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.LOGIN_MAX_ATTEMPTS = '2';
process.env.LOGIN_LOCK_MS = '60000';
process.env.AUTH_RATE_LIMIT_MAX = '200';
process.env.AUTH_RATE_LIMIT_WINDOW_MS = '60000';

const { createApp } = require('../server');
const { connectDatabase } = require('../config/database');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

let mongo;
let app;

test.before(async () => {
    mongo = await MongoMemoryServer.create();
    await connectDatabase(mongo.getUri());
    app = createApp();
});

test.after(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});

test.beforeEach(async () => {
    await Promise.all([
        User.deleteMany({}),
        RefreshToken.deleteMany({})
    ]);
});

test('register returns access and refresh tokens', async () => {
    const response = await request(app)
        .post('/register')
        .send({ username: 'tester_01', password: 'StrongPass!123' })
        .expect(201);

    assert.ok(response.body.accessToken);
    assert.ok(response.body.refreshToken);
    assert.equal(response.body.user.role, 'user');
});

test('refresh rotates refresh token and keeps auth valid', async () => {
    const registerRes = await request(app)
        .post('/register')
        .send({ username: 'tester_02', password: 'StrongPass!123' })
        .expect(201);

    const firstRefresh = registerRes.body.refreshToken;

    const refreshRes = await request(app)
        .post('/refresh')
        .send({ refreshToken: firstRefresh })
        .expect(200);

    assert.ok(refreshRes.body.accessToken);
    assert.ok(refreshRes.body.refreshToken);
    assert.notEqual(refreshRes.body.refreshToken, firstRefresh);

    await request(app)
        .post('/refresh')
        .send({ refreshToken: firstRefresh })
        .expect(401);
});

test('failed logins trigger account lockout', async () => {
    await request(app)
        .post('/register')
        .send({ username: 'tester_03', password: 'StrongPass!123' })
        .expect(201);

    await request(app)
        .post('/login')
        .send({ username: 'tester_03', password: 'wrong' })
        .expect(401);

    await request(app)
        .post('/login')
        .send({ username: 'tester_03', password: 'wrong' })
        .expect(401);

    const lockedRes = await request(app)
        .post('/login')
        .send({ username: 'tester_03', password: 'StrongPass!123' })
        .expect(423);

    assert.match(lockedRes.body.error, /locked/i);
});

test('logout revokes refresh token', async () => {
    const registerRes = await request(app)
        .post('/register')
        .send({ username: 'tester_04', password: 'StrongPass!123' })
        .expect(201);

    const { accessToken, refreshToken } = registerRes.body;

    await request(app)
        .post('/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

    await request(app)
        .post('/refresh')
        .send({ refreshToken })
        .expect(401);
});
