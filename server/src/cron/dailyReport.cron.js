const cron = require('node-cron');
const User = require('../models/User');
const { broadcastNotification } = require('../services/notification.service');
const { reportQueue } = require('../config/redis');

const startDailyReportCron = () => {
  // 6pm weekdays — Ping all employees to submit EOD update
  cron.schedule('0 18 * * 1-5', async () => {
    console.log('6pm EOD ping — Asking employees for updates');
    try {
      const employees = await User.find({ isActive: true, role: 'employee' }).select('_id');
      const ids = employees.map((e) => e._id);

      broadcastNotification(ids, {
        type: 'eod_reminder',
        title: 'EOD Update Reminder',
        message: 'Please submit your end-of-day update now.',
      });
    } catch (err) {
      console.error('EOD ping failed:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  // 7pm weekdays — Collect all submissions and generate report
  cron.schedule('0 19 * * 1-5', async () => {
    console.log('7pm — Generating daily report');
    try {
      const today = new Date().toISOString().split('T')[0];
      if (reportQueue) {
        await reportQueue.add('generate-report', { date: today });
      } else {
        console.log('Redis not configured — report generation skipped');
      }
    } catch (err) {
      console.error('Report generation trigger failed:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('Daily report crons scheduled (6pm ping, 7pm generate)');
};

module.exports = { startDailyReportCron };
