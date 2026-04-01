require('./setup');
const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const User = require('../models/User');
const BlacklistedToken = require('../models/BlacklistedToken');

// Build a minimal Express app for testing auth routes
const app = express();
app.use(express.json());
app.use('/api/auth', require('../routes/auth.routes'));

const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Password123',
  role: 'employee',
};

describe('Auth API', () => {
  // 1. Register
  test('Register new user → 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
  });

  // 2. Duplicate registration
  test('Register duplicate email → 400', async () => {
    await User.create(testUser);
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already/i);
  });

  // 3. Login success
  test('Login with correct credentials → 200', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  // 4. Login wrong password
  test('Login with wrong password → 401', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'WrongPassword' });
    expect(res.status).toBe(401);
  });

  // 5. Access protected without token
  test('Access /me without token → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  // 6. Access protected with token
  test('Access /me with valid token → 200', async () => {
    const reg = await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
  });

  // 7. Refresh token
  test('Refresh token → new access token', async () => {
    const reg = await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: reg.body.refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  // 8. Logout blacklists token
  test('Logout → token blacklisted', async () => {
    const reg = await request(app).post('/api/auth/register').send(testUser);
    const token = reg.body.accessToken;

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(logoutRes.status).toBe(200);

    // Token should now be blacklisted
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(401);
  });
});
