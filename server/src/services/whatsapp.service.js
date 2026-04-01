const { Client, LocalAuth } = require('whatsapp-web.js');

let client = null;
let isReady = false;
let qrCode = null;

const initWhatsApp = () => {
  if (client) return;

  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.on('qr', (qr) => {
    qrCode = qr;
    console.log('WhatsApp QR code generated. Scan to authenticate.');
    // In production, you'd send this to the admin dashboard via Socket.io
  });

  client.on('ready', () => {
    isReady = true;
    qrCode = null;
    console.log('WhatsApp client is ready');
  });

  client.on('disconnected', (reason) => {
    isReady = false;
    console.log('WhatsApp disconnected:', reason);
  });

  client.initialize().catch((err) => {
    console.error('WhatsApp init failed:', err.message);
    console.log('WhatsApp is optional — other channels will still work.');
  });
};

const sendWhatsAppMessage = async (phone, message) => {
  if (!isReady || !client) {
    throw new Error('WhatsApp client not ready. Scan QR code first.');
  }

  // Ensure phone format: countrycode + number (no + or spaces)
  const chatId = phone.replace(/[^0-9]/g, '') + '@c.us';
  const result = await client.sendMessage(chatId, message);
  return { id: result.id._serialized, status: 'sent' };
};

const getWhatsAppStatus = () => ({
  isReady,
  qrCode,
});

module.exports = {
  initWhatsApp,
  sendWhatsAppMessage,
  getWhatsAppStatus,
};
