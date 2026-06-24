import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const base = 'C:/Users/Acer/Documents/Apotek_POS';
  const pdfUrl = 'file:///' + base.replace(/\\/g, '/') + '/preview_struk_pdf.html';
  const outPath = path.join(base, 'audit_notes', 'kasir', 'struk_test.pdf');
  
  // Set dummy transaction data before opening
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('apotek_pos_profile_name', 'Apotek POS Test');
    localStorage.setItem('apotek_pos_profile_alamat', 'Jl. Puppeteer No. 99');
    
    // Inject a dummy transaction as lastTransaction
    window._lastTransactionForPDF = {
      trxNo: '#TRX-20261122-9999',
      subtotal: 15000,
      methodLabel: 'tunai',
      now: new Date().toISOString(),
      cart: [
        { name: 'Produk Test A', qty: 1, price: 10000 },
        { name: 'Produk Test B', qty: 1, price: 5000 }
      ],
      received: 20000,
      change: 5000,
      apotekNama: 'Apotek POS Test'
    };
    
    // Also store it in localStorage since preview_struk_pdf.html might read from there
    localStorage.setItem('apotek_pos_last_trx', JSON.stringify(window._lastTransactionForPDF));
  });

  await page.goto(pdfUrl, { waitUntil: 'networkidle2' });
  
  // Create PDF matching print-area dimensions (58mm thermal paper)
  await page.pdf({
    path: outPath,
    width: '58mm',
    height: '150mm',
    printBackground: true
  });

  await browser.close();
  console.log('PDF Generated:', outPath);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
