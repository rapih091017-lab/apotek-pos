const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// SERVE FRONTEND POS STATIC FILES
app.use(express.static(__dirname));

// WHATSAPP CLIENT (optional — graceful fallback)
let client = null;
let isClientReady = false;

try {
  const { Client, LocalAuth } = require('whatsapp-web.js');
  const qrcode = require('qrcode-terminal');

  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
  });

  client.on('qr', (qr) => {
    console.log('\n📱 SCAN QR CODE INI DI WHATSAPP:');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('✅ WHATSAPP BOT SIAP!');
    isClientReady = true;
  });

  client.initialize().catch(() => {
    console.log('⚠️ WhatsApp bot tidak bisa start (no browser/RAM) — server tetap jalan.');
  });
} catch(e) {
  console.log('⚠️ WhatsApp module tidak tersedia — server tetap jalan tanpa WA bot.');
}

app.post('/api/send-wa', async (req, res) => {
  if (!isClientReady || !client) {
    return res.status(503).json({ error: 'WhatsApp bot belum siap.', fallback: true });
  }
  try {
    let { number, message } = req.body;
    if (!number) return res.status(400).json({ error: 'Nomor WA diperlukan.' });
    number = number.replace(/[^0-9]/g, '');
    if (!number.startsWith('62')) {
      if (number.startsWith('0')) number = '62' + number.substring(1);
      else number = '62' + number;
    }
    if (!message) return res.status(400).json({ error: 'Pesan WA diperlukan.' });
    await client.sendMessage(number + '@c.us', message);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.toString() });
  }
});

// Health check endpoint (Render needs this)
app.get('/health', (req, res) => res.json({ status: 'ok', project: 'apotek-pos' }));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 APOTEK POS jalan di port ${PORT}`);
  console.log(`👉 http://localhost:${PORT}/login.html`);
});
