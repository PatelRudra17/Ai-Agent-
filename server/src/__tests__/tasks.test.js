require('./setup');
const request = require('supertest');
const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');

const app = express();
app.use(express.json());
app.use('/api/auth', require('../routes/auth.routes'));
app.use('/api/tasks', require('../routes/tasks.routes'));

const managerData = { name: 'Manager', email: 'manager@test.com', password: 'Password123', role: 'manager' };
const employeeData = { name: 'Employee', email: 'emp@test.com', password: 'Password123', role: 'employee' };

let managerToken, employeeToken, managerId, employeeId;

beforeEach(async () => {
  const mReg = await request(app).post('/api/auth/register').send(managerData);
  managerToken = mReg.body.accessToken;
  managerId = mReg.body.user.id;

  const eReg = await request(app).post('/api/auth/register').send(employeeData);
  employeeToken = eReg.body.accessToken;
  employeeId = eReg.body.user.id;

  // Set manager as the employee's manager
  await User.findByIdAndUpdate(employeeId, { managerId });
});

describe('Tasks API', () => {
  // 1. Create task as manager
  test('Create task as manager → 201', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ title: 'Test Task', description: 'Test desc', assignedTo: employeeId, priority: 'high' });
    expect(res.status).toBe(201);
    expect(res.body.task.title).toBe('Test Task');
  });

  // 2. Create task as employee → 403
  test('Create task as employee → 403', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ title: 'Test', assignedTo: employeeId });
    expect(res.status).toBe(403);
  });

  // 3. Get my tasks
  test('Get my tasks → returns own tasks', async () => {
    await Task.create({ title: 'My Task', assignedTo: employeeId, assignedBy: managerId, queueOrder: 1 });
    const res = await request(app)
      .get('/api/tasks/my')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.tasks[0].title).toBe('My Task');
  });

  // 4. Complete task → next auto-starts
  test('Complete task → next task auto-starts', async () => {
    const task1 = await Task.create({ title: 'Task 1', assignedTo: employeeId, assignedBy: managerId, status: 'inprogress', queueOrder: 1 });
    await Task.create({ title: 'Task 2', assignedTo: employeeId, assignedBy: managerId, status: 'pending', queueOrder: 2 });

    const res = await request(app)
      .patch(`/api/tasks/${task1._id}/complete`)
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe('done');
    expect(res.body.nextTask).toBeDefined();
    expect(res.body.nextTask.title).toBe('Task 2');
  });

  // 5. Get team tasks as manager
  test('Get team tasks as manager → returns tasks', async () => {
    await Task.create({ title: 'Team Task', assignedTo: employeeId, assignedBy: managerId, queueOrder: 1 });
    const res = await request(app)
      .get('/api/tasks/team')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBeGreaterThanOrEqual(1);
  });

  // 6. Get task by ID
  test('Get task by ID → returns populated task', async () => {
    const task = await Task.create({ title: 'Detail Task', assignedTo: employeeId, assignedBy: managerId, queueOrder: 1 });
    const res = await request(app)
      .get(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.task.title).toBe('Detail Task');
  });
});
