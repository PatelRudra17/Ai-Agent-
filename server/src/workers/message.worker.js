const { Worker } = require('bullmq');
const Message = require('../models/Message');
const User = require('../models/User');
const { sendEmail, wrapHtml } = require('../services/email.service');
const { sendInAppNotification, emitStatusUpdate } = require('../services/notification.service');

let messageWorker;

const sendViaChannel = async (channel, recipient, message) => {
  switch (channel) {
    case 'email':
      await sendEmail({
        to: recipient.email,
        subject: message.subject || 'Message from Corporate AI',
        text: message.body,
        html: wrapHtml(message.subject || 'New Message', `<p style="color: #374151; line-height: 1.6;">${message.body}</p>`),
      });
      return 'sent';

    case 'in-app':
      sendInAppNotification(recipient._id, {
        type: 'scheduled_message',
        title: message.subject || 'New Message',
        message: message.body,
      });
      return 'sent';

    case 'whatsapp':
      // Optional — only works if WhatsApp is connected
      try {
        const { sendWhatsAppMessage } = require('../services/whatsapp.service');
        if (recipient.phone) {
          await sendWhatsAppMessage(recipient.phone, message.body);
          return 'sent';
        }
        return 'failed';
      } catch {
        // Fallback to email if WhatsApp not ready
        await sendEmail({
          to: recipient.email,
          subject: `[WhatsApp fallback] ${message.subject || 'Message'}`,
          text: message.body,
          html: wrapHtml('Message (WhatsApp unavailable)', `<p style="color: #374151;">${message.body}</p>`),
        });
        return 'sent';
      }

    case 'slack':
      try {
        const { WebClient } = require('@slack/web-api');
        const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
        await slack.chat.postMessage({
          channel: recipient.email, // Use email to find Slack user
          text: message.body,
        });
        return 'sent';
      } catch {
        return 'failed';
      }

    default:
      return 'failed';
  }
};

const startMessageWorker = (redisConnection) => {
  messageWorker = new Worker(
    'message-queue',
    async (job) => {
      const { messageId } = job.data;
      console.log(`Processing message job: ${messageId}`);

      const msg = await Message.findById(messageId);
      if (!msg || msg.status === 'cancelled') {
        console.log('Message cancelled or not found, skipping');
        return;
      }

      const recipients = await User.find({ _id: { $in: msg.recipients } });
      let allSent = true;

      for (const recipient of recipients) {
        try {
          const status = await sendViaChannel(msg.channel, recipient, msg);
          // Update delivery log
          const logEntry = msg.deliveryLog.find(
            (l) => l.userId.toString() === recipient._id.toString()
          );
          if (logEntry) {
            logEntry.status = status;
            logEntry.sentAt = new Date();
          } else {
            msg.deliveryLog.push({ userId: recipient._id, status, sentAt: new Date() });
          }
          if (status === 'failed') allSent = false;
        } catch (error) {
          console.error(`Failed to send to ${recipient.email}:`, error.message);
          msg.deliveryLog.push({
            userId: recipient._id,
            status: 'failed',
            error: error.message,
          });
          allSent = false;
        }
      }

      msg.status = allSent ? 'sent' : 'failed';
      await msg.save();

      emitStatusUpdate('message_delivered', {
        messageId: msg._id,
        status: msg.status,
        channel: msg.channel,
      });

      console.log(`Message ${messageId} processed: ${msg.status}`);
    },
    {
      connection: redisConnection,
      concurrency: 5,
      limiter: { max: 20, duration: 1000 },
    }
  );

  messageWorker.on('completed', (job) => {
    console.log(`Message job ${job.id} completed`);
  });

  messageWorker.on('failed', (job, err) => {
    console.error(`Message job ${job?.id} failed:`, err.message);
  });

  return messageWorker;
};

module.exports = { startMessageWorker };
