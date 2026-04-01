const { Worker } = require('bullmq');
const CallLog = require('../models/CallLog');
const User = require('../models/User');
const { sendCallNotification } = require('../services/notification.service');
const { emitStatusUpdate } = require('../services/notification.service');

let callWorker;

const startCallWorker = (redisConnection) => {
  callWorker = new Worker(
    'call-queue',
    async (job) => {
      const { callLogId } = job.data;
      console.log(`Processing call job: ${callLogId}`);

      const callLog = await CallLog.findById(callLogId);
      if (!callLog || callLog.status === 'cancelled') {
        console.log('Call cancelled or not found, skipping');
        return;
      }

      // Update status
      callLog.status = 'notifying';
      await callLog.save();

      try {
        // Get recipient details
        const recipient = await User.findById(callLog.recipient);
        const scheduler = await User.findById(callLog.scheduledBy);

        if (!recipient) throw new Error('Recipient not found');

        // Send notification instead of actual call (FREE alternative to Twilio)
        const result = await sendCallNotification({
          recipientId: recipient._id,
          recipientEmail: recipient.email,
          recipientPhone: callLog.recipientPhone,
          callerName: scheduler?.name || 'Manager',
          message: callLog.message,
          scheduledAt: callLog.scheduledAt,
        });

        callLog.status = 'notified';
        callLog.notificationMethod = result.method;
        await callLog.save();

        // Emit real-time status update
        emitStatusUpdate('call_status', {
          callLogId: callLog._id,
          status: 'notified',
          method: result.method,
        });

        console.log(`Call notification sent for ${callLogId}`);
      } catch (error) {
        console.error(`Call notification failed for ${callLogId}:`, error.message);

        callLog.retryCount += 1;
        if (callLog.retryCount >= 3) {
          callLog.status = 'failed';
        } else {
          callLog.status = 'pending';
        }
        await callLog.save();

        emitStatusUpdate('call_status', {
          callLogId: callLog._id,
          status: callLog.status,
          error: error.message,
        });

        throw error; // BullMQ will retry
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
      limiter: { max: 10, duration: 1000 },
    }
  );

  callWorker.on('completed', (job) => {
    console.log(`Call job ${job.id} completed`);
  });

  callWorker.on('failed', (job, err) => {
    console.error(`Call job ${job?.id} failed:`, err.message);
  });

  return callWorker;
};

module.exports = { startCallWorker };
