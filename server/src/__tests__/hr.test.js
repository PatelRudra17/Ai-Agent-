require('./setup');
const request = require('supertest');
const express = require('express');
const User = require('../models/User');

const app = express();
app.use(express.json());
app.use('/api/auth', require('../routes/auth.routes'));
app.use('/api/hr', require('../routes/hr.routes'));

const managerData = { name: 'Manager', email: 'mgr@test.com', password: 'Password123', role: 'manager' };
const employeeData = { name: 'Employee', email: 'emp@test.com', password: 'Password123', role: 'employee' };

let managerToken, employeeToken, managerId, employeeId;

beforeEach(async () => {
  const mReg = await request(app).post('/api/auth/register').send(managerData);
  managerToken = mReg.body.accessToken;
  managerId = mReg.body.user.id;

  const eReg = await request(app).post('/api/auth/register').send(employeeData);
  employeeToken = eReg.body.accessToken;
  employeeId = eReg.body.user.id;

  await User.findByIdAndUpdate(employeeId, { managerId });
});

describe('HR API', () => {
  // 1. Apply leave
  test('Apply leave → 201', async () => {
    const res = await request(app)
      .post('/api/hr/leave/apply')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        type: 'casual',
        fromDate: '2026-04-10',
        toDate: '2026-04-11',
        reason: 'Personal work',
      });
    expect(res.status).toBe(201);
    expect(res.body.leave.status).toBe('pending');
  });

  // 2. Approve leave
  test('Approve leave as manager → approved', async () => {
    const applyRes = await request(app)
      .post('/api/hr/leave/apply')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ type: 'casual', fromDate: '2026-04-10', toDate: '2026-04-11', reason: 'Test' });

    const leaveId = applyRes.body.leave._id;
    const res = await request(app)
      .patch(`/api/hr/leave/${leaveId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.leave.status).toBe('approved');
  });

  // 3. Reject leave
  test('Reject leave → rejected', async () => {
    const applyRes = await request(app)
      .post('/api/hr/leave/apply')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ type: 'sick', fromDate: '2026-04-12', toDate: '2026-04-13', reason: 'Test' });

    const leaveId = applyRes.body.leave._id;
    const res = await request(app)
      .patch(`/api/hr/leave/${leaveId}/reject`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ reason: 'Insufficient notice' });
    expect(res.status).toBe(200);
    expect(res.body.leave.status).toBe('rejected');
  });

  // 4. Clock in
  test('Clock in → attendance record created', async () => {
    const res = await request(app)
      .post('/api/hr/attendance/clock-in')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.attendance.clockIn).toBeDefined();
  });

  // 5. Clock out
  test('Clock out → hours calculated', async () => {
    await request(app)
      .post('/api/hr/attendance/clock-in')
      .set('Authorization', `Bearer ${employeeToken}`);

    const res = await request(app)
      .post('/api/hr/attendance/clock-out')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.attendance.clockOut).toBeDefined();
  });
});
