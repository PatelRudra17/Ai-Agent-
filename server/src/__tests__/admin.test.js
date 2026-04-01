require('./setup');
const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());
app.use('/api/auth', require('../routes/auth.routes'));
app.use('/api/admin', require('../routes/admin.routes'));

const adminData = { name: 'Admin', email: 'admin@test.com', password: 'Password123', role: 'admin' };
const employeeData = { name: 'Employee', email: 'emp@test.com', password: 'Password123', role: 'employee' };

let adminToken, employeeToken, employeeId;

beforeEach(async () => {
  const aReg = await request(app).post('/api/auth/register').send(adminData);
  adminToken = aReg.body.accessToken;

  const eReg = await request(app).post('/api/auth/register').send(employeeData);
  employeeToken = eReg.body.accessToken;
  employeeId = eReg.body.user.id;
});

describe('Admin API', () => {
  // 1. Get system stats as admin
  test('Get system stats as admin → 200', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.stats).toBeDefined();
  });

  // 2. Access admin as employee → 403
  test('Access admin route as employee → 403', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(403);
  });

  // 3. Change user role
  test('Change user role as admin → updated', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${employeeId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'manager' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('manager');
  });

  // 4. Deactivate user
  test('Deactivate user as admin → isActive false', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${employeeId}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.isActive).toBe(false);
  });
});
