require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Create Admin
  const adminExists = await User.findOne({ email: 'admin@company.com' });
  if (!adminExists) {
    await User.create({
      name: 'Admin Boss',
      email: 'admin@company.com',
      password: 'admin123',
      role: 'admin',
      department: 'Management',
      phone: '+91-9999999999',
    });
    console.log('Admin created: admin@company.com / admin123');
  } else {
    console.log('Admin already exists');
  }

  // Create Manager
  const managerExists = await User.findOne({ email: 'manager@company.com' });
  let managerId;
  if (!managerExists) {
    const mgr = await User.create({
      name: 'Rahul Manager',
      email: 'manager@company.com',
      password: 'manager123',
      role: 'manager',
      department: 'Engineering',
      phone: '+91-8888888888',
    });
    managerId = mgr._id;
    console.log('Manager created: manager@company.com / manager123');
  } else {
    managerId = managerExists._id;
    console.log('Manager already exists');
  }

  // Create Employees
  const employees = [
    { name: 'Priya Sharma', email: 'priya@company.com', department: 'Engineering' },
    { name: 'Amit Patel', email: 'amit@company.com', department: 'Engineering' },
    { name: 'Neha Gupta', email: 'neha@company.com', department: 'Design' },
  ];

  for (const emp of employees) {
    const exists = await User.findOne({ email: emp.email });
    if (!exists) {
      await User.create({
        ...emp,
        password: 'employee123',
        role: 'employee',
        managerId,
      });
      console.log(`Employee created: ${emp.email} / employee123`);
    } else {
      console.log(`Employee ${emp.email} already exists`);
    }
  }

  console.log('\n--- Login Credentials ---');
  console.log('Admin:    admin@company.com    / admin123');
  console.log('Manager:  manager@company.com  / manager123');
  console.log('Employee: priya@company.com    / employee123');
  console.log('Employee: amit@company.com     / employee123');
  console.log('Employee: neha@company.com     / employee123');

  await mongoose.disconnect();
  console.log('\nDone!');
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
