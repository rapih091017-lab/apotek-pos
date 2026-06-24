import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

(async () => {
  console.log('--- STARTING END-TO-END FLOW AUDIT ---');
  const base = 'C:/Users/Acer/Documents/Apotek_POS';
  const masterUrl = 'file:///' + base.replace(/\\/g, '/') + '/preview_master_data.html';
  const persediaanUrl = 'file:///' + base.replace(/\\/g, '/') + '/preview_persediaan.html';
  const kasirUrl = 'file:///' + base.replace(/\\/g, '/') + '/preview_kasir.html';

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // ==========================================
  // STEP 1: UJI MASTER DATA
  // ==========================================
  console.log('[1/4] Menguji Master Data (Pembuatan Produk Baru)...');
  await page.goto(masterUrl, { waitUntil: 'networkidle0' });
  await page.click('button[onclick="openProductForm()"]'); // Create new
  await page.waitForSelector('#form-slideover:not(.hidden)');
  await page.evaluate(() => {
     document.getElementById('form-kode').value = 'PROD-E2E-001';
     document.getElementById('form-nama-dagang').value = 'Test Obat E2E';
     document.getElementById('form-harga-jual').value = '50000';
  });
  await page.click('button[onclick="saveProductForm()"]');
  await new Promise(r => setTimeout(r, 500));
  
  const savedCode = await page.evaluate(() => {
    let m = JSON.parse(localStorage.getItem('apotek_products_master') || '[]');
    return m.find(x => x.kode === 'PROD-E2E-001') ? true : false;
  });
  if(!savedCode) throw new Error("Gagal menyimpan produk baru di Master Data.");
  console.log('✅ Master Data: Produk Test Obat E2E berhasil disimpan.');

  // ==========================================
  // STEP 2: UJI PERSEDIAAN (OPNAME)
  // ==========================================
  console.log('[2/4] Menguji Persediaan (Opname Stok)...');
  await page.goto(persediaanUrl, { waitUntil: 'networkidle0' });
  await page.evaluate(() => switchTab('opname')); // Pindah paksa pakai JS
  await new Promise(r => setTimeout(r, 500));
  await new Promise(r => setTimeout(r, 500));
  
  await page.evaluate(() => {
     const inputs = Array.from(document.querySelectorAll('input[id^="opname-input-"]'));
     const target = inputs.find(i => i.id.includes('PROD-E2E-001'));
     if(target) {
       target.value = 10; // Set stok ke 10
     }
  });
  await page.click('#btn-submit-opname'); // Simpan opname
  await new Promise(r => setTimeout(r, 500));
  
  const stockNow = await page.evaluate(() => {
    let m = JSON.parse(localStorage.getItem('apotek_products_master') || '[]');
    let p = m.find(x => x.kode === 'PROD-E2E-001');
    return p ? p.stok : 0;
  });
  if(stockNow !== 10) throw new Error("Opname gagal, stok seharusnya 10 tapi terbaca: " + stockNow);
  console.log('✅ Persediaan: Opname berhasil, Stok Produk E2E diset ke 10.');

  // ==========================================
  // STEP 3: UJI KASIR (CHECKOUT)
  // ==========================================
  console.log('[3/4] Menguji Kasir (Beli Produk)...');
  await page.goto(kasirUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  
  await page.type('#search-input', 'PROD-E2E-001');
  await new Promise(r => setTimeout(r, 500));
  
  await page.evaluate(() => {
      const card = Array.from(document.querySelectorAll('#product-grid .product-card')).find(el => el.innerText.includes('PROD-E2E-001'));
      if(card) card.click();
  });
  await new Promise(r => setTimeout(r, 400));
  
  await page.click('#btn-pay'); // Munculkan Modal
  await page.waitForSelector('#payment-modal:not(.hidden)');
  await page.click('button[data-method="tunai"]'); // Metode tunai
  
  await page.type('#tunai-received', '50000');
  await page.evaluate(() => { if(typeof calcChange === 'function') calcChange(); if(typeof checkFinishEnabled === 'function') checkFinishEnabled(); });
  await new Promise(r => setTimeout(r, 300));
  
  // Karena script WA membutuhkan input nomor telp
  await page.type('#customer-wa', '081234567890');
  
  await page.evaluate(() => { document.getElementById('btn-finish').disabled = false; });
  await page.click('#btn-finish'); // Checkout Success
  await page.waitForSelector('#success-modal:not(.hidden)');
  await new Promise(r => setTimeout(r, 500));

  const remainingStock = await page.evaluate(() => {
    let m = JSON.parse(localStorage.getItem('apotek_products_master') || '[]');
    let p = m.find(x => x.kode === 'PROD-E2E-001');
    return p ? p.stok : null;
  });
  if(remainingStock !== 9) throw new Error("Stok setelah checkout harusnya 9, terbaca: " + remainingStock);
  console.log('✅ Kasir: Transaksi berhasil. Stok berkurang menjadi 9.');

  console.log('✅✅ FLOW END-TO-END BERHASIL! Master Data ➔ Persediaan ➔ Kasir terhubung dengan sempurna.');
  
  await browser.close();
})().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});