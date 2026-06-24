const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true } // Gunakan headless untuk Chrome di WA Web JS
});

let isClientReady = false;

client.on('qr', (qr) => {
    console.log('SCAN QR CODE DI BAWAH INI MENGGUNAKAN WHATSAPP ANDA (Mode Tautkan Perangkat):');
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('WHATSAPP BOT SIAP! API dapat digunakan.');
    isClientReady = true;
});

client.on('message_create', message => {
	if (message.body === '!ping') {
		client.sendMessage(message.from, 'pong');
	}
});

client.initialize();

/**
 * Fungsi internal untuk generate PDF Struk pakai Puppeteer berdasarkan template User
 */
async function generatePDFStruk(data) {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Siapkan list barang html
    let itemRows = '';
    let totalBelanja = 0;
    (data.cart || []).forEach(item => {
        let sub = item.qty * item.price;
        totalBelanja += sub;
        itemRows += `
            <tr><td colspan="2" style="padding-top: 4px;">${item.name}</td></tr>
            <tr>
                <td style="color: #444;">&nbsp;&nbsp;${item.qty} x ${item.price.toLocaleString('id-ID')}</td>
                <td style="text-align: right; vertical-align: bottom;">${sub.toLocaleString('id-ID')}</td>
            </tr>
        `;
    });

    let kembalian = data.change || 0;
    let bayarVal = data.received || totalBelanja;

    // Desain Persis Template Thermal 58mm User
    const htmlTemplate = `
    <html>
      <body style="margin: 0; padding: 2mm; background: white;">
        <div style="font-family: 'Courier New', Courier, monospace; width: 58mm; font-size: 11px; padding: 4px; color: #000; background: #fff; line-height: 1.2;">
            <div style="text-align: center; margin-bottom: 4px;">
                <strong style="font-size: 13px;">${data.apotekNama || 'Apotek POS'}</strong><br>
                Apotek POS System<br>
            </div>
            <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
            <table style="width: 100%; font-size: 11px; font-family: inherit;">
                <tr><td>Nota : ${data.trxNo}</td></tr>
                <tr><td>Tgl  : ${new Date(data.now).toLocaleString('id-ID')}</td></tr>
            </table>
            <div style="border-top: 1px double #000; margin: 4px 0;"></div>
            <table style="width: 100%; font-size: 11px; font-family: inherit; border-collapse: collapse;">
                ${itemRows}
            </table>
            <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
            <table style="width: 100%; font-size: 11px; font-family: inherit;">
                <tr>
                    <td><strong>TOTAL:</strong></td>
                    <td style="text-align: right;"><strong>${totalBelanja.toLocaleString('id-ID')}</strong></td>
                </tr>
                <tr>
                    <td>BAYAR:</td>
                    <td style="text-align: right;">${bayarVal.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                    <td>KEMBALI:</td>
                    <td style="text-align: right;">${kembalian.toLocaleString('id-ID')}</td>
                </tr>
            </table>
            <div style="border-top: 1px double #000; margin: 4px 0;"></div>
            <div style="text-align: center; margin-top: 8px; margin-bottom: 20px;">
                TERIMA KASIH<br>Atas Kunjungan Anda
            </div>
        </div>
      </body>
    </html>
    `;

    await page.setContent(htmlTemplate);
    const pdfPath = path.join(__dirname, 'audit_notes', 'kasir', `struk_${data.trxNo.replace(/[^a-zA-Z0-9]/g, '')}.pdf`);
    
    await page.pdf({
        path: pdfPath,
        width: '58mm',
        height: '150mm', // Force panjang supaya konten tidak terpotong
        printBackground: true
    });
    
    await browser.close();
    return pdfPath;
}

// API Endpoint Kirim WA
app.post('/api/send-wa', async (req, res) => {
    if (!isClientReady) {
        return res.status(503).json({ error: 'WhatsApp bot belum siap (scan QR dulu).' });
    }

    try {
        let { number, message, transactionData } = req.body;
        number = number.replace(/[^0-9]/g, '');
        if (number.startsWith('0')) number = '62' + number.substring(1);
        const chatId = number + "@c.us";

        let generatedPdfPath = null;
        if (transactionData) {
            // Kita generate PDF di server
            console.log(`Meng-generate PDF untuk transaksi ${transactionData.trxNo}...`);
            generatedPdfPath = await generatePDFStruk(transactionData);
        }

        // Kirim Pesan Text dulu
        if (message) {
            await client.sendMessage(chatId, message);
        }

        // Kalau PDF beres, kirim file PDF-nya
        if (generatedPdfPath && fs.existsSync(generatedPdfPath)) {
            const media = MessageMedia.fromFilePath(generatedPdfPath);
            await client.sendMessage(chatId, media, { caption: '📄 Ini file PDF E-Struk Anda.' });
            
            // Hapus file pdf sementara kalau tidak mau menuhin memory, 
            // sementara saya biarkan agar bisa Anda cek di folder.
        }

        console.log(`Berhasil kirim WA & PDF ke ${number}`);
        return res.json({ success: true, message: 'WhatsApp sent successfully with PDF' });

    } catch (err) {
        console.error('Error send WA:', err);
        return res.status(500).json({ error: err.toString() });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server API WhatsApp berjalan di port ${PORT}`);
});
