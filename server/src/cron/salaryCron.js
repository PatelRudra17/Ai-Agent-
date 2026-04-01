const cron = require('node-cron');
const User = require('../models/User');
const { generateSalarySlip } = require('../services/salary.service');
const { sendEmail, wrapHtml } = require('../services/email.service');

// Default salary structure (in production, fetch from DB or HR config)
const DEFAULT_SALARY = {
  basic: 50000,
  hra: 20000,
  da: 5000,
  special: 10000,
  pf: 6000,
  tax: 8500,
};

const startSalaryCron = () => {
  // 1st of every month at 10:00 AM — Generate and email salary slips
  cron.schedule('0 10 1 * *', async () => {
    console.log('Generating monthly salary slips...');

    try {
      const now = new Date();
      const month = now.getMonth() + 1; // Current month (slip is for previous month work)
      const year = now.getFullYear();

      const employees = await User.find({ isActive: true, role: 'employee' });
      console.log(`Generating slips for ${employees.length} employees`);

      for (const emp of employees) {
        try {
          const result = await generateSalarySlip({
            employee: emp,
            month,
            year,
            salary: DEFAULT_SALARY, // In production, fetch per-employee salary from DB
          });

          // Email the salary slip
          await sendEmail({
            to: emp.email,
            subject: `Salary Slip — ${month}/${year}`,
            text: `Your salary slip for ${month}/${year} is attached. Net Pay: Rs. ${result.netPay.toLocaleString('en-IN')}`,
            html: wrapHtml(
              `Salary Slip — ${month}/${year}`,
              `<p>Dear ${emp.name},</p>
              <p>Your salary slip for <strong>${month}/${year}</strong> has been generated.</p>
              <p><strong>Net Pay: Rs. ${result.netPay.toLocaleString('en-IN')}</strong></p>
              <p>You can download it from your dashboard.</p>`
            ),
          });

          console.log(`Salary slip sent to ${emp.name} (${emp.email})`);
        } catch (err) {
          console.error(`Salary slip failed for ${emp.name}:`, err.message);
        }
      }

      console.log('Monthly salary slips completed');
    } catch (err) {
      console.error('Salary cron failed:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('Salary cron scheduled (1st of every month, 10:00 AM)');
};

module.exports = { startSalaryCron };
