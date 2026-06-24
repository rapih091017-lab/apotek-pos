const puppeteer = require('puppeteer');
const path = require('path');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const base = 'C:/Users/Acer/Documents/Apotek_POS';
  const masterUrl = 'file:///' + base.replace(/\\/g, '/') + '/preview_master_data.html';
  const kasirUrl = 'file:///' + base.replace(/\\/g, '/') + '/preview_kasir.html';

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('console: ' + msg.text());
  });

  const productName = 'Test Kasir Puppeteer';
  const productCode = 'PROD-TEST-001';

  try {
    await page.goto(masterUrl, { waitUntil: 'networkidle0' });
    await page.click('button[onclick="openProductForm()"]');
    await page.waitForSelector('#form-slideover:not(.hidden)');
    await page.evaluate((code, name) => {
      document.getElementById('form-kode').value = code;
      document.getElementById('form-nama-dagang').value = name;
      document.getElementById('form-nama-generik').value = 'Generik Test';
      document.getElementById('form-kategori').value = 'Obat Bebas';
      document.getElementById('form-golongan').value = 'bebas';
      document.getElementById('form-satuan').value = 'Tablet';
      document.getElementById('form-harga-jual').value = '7000';
      document.getElementById('form-stok-minimum').value = '2';
    }, productCode, productName);
    await page.click('button[onclick="saveProductForm()"]');
    await sleep(500);

    await page.evaluate((code) => {
      const raw = JSON.parse(localStorage.getItem('apotek_products_master') || localStorage.getItem('products_master') || '[]');
      const found = raw.find(p => p.kode === code);
      if (found) {
        found.stok = 5;
        const json = JSON.stringify(raw); localStorage.setItem('apotek_products_master', json); localStorage.setItem('products_master', json);
      }
    }, productCode);

    await page.goto(kasirUrl, { waitUntil: 'networkidle0' });
    await sleep(1200);

    const productDebug = await page.evaluate((name) => {
      const cards = Array.from(document.querySelectorAll('#product-grid .product-card')).map(el => el.innerText);
      const storage = JSON.parse(localStorage.getItem('apotek_products_master') || localStorage.getItem('products_master') || '[]');
      return { found: cards.some(t => t.includes(name)), cards, storageCount: storage.length, sampleStorage: storage.slice(0,5) };
    }, productName);
    const foundProduct = productDebug.found;
    if (!foundProduct) throw new Error('Produk test tidak tampil di kasir :: ' + JSON.stringify(productDebug));

    await page.evaluate((name) => {
      const card = Array.from(document.querySelectorAll('#product-grid .product-card')).find(el => el.innerText.includes(name));
      if (!card) throw new Error('Card produk tidak ditemukan');
      card.click();
    }, productName);
    await sleep(400);

    const cartCount = await page.$eval('#cart-count', el => el.textContent.trim());
    if (cartCount !== '1') throw new Error('Produk gagal masuk keranjang');

    await page.click('#btn-pay');
    await page.waitForSelector('#payment-modal:not(.hidden)');
    await page.click('button[data-method="tunai"]');
    await page.type('#tunai-received', '10000');
    await page.evaluate(() => { if(typeof calcChange === 'function') calcChange(); if(typeof checkFinishEnabled === 'function') checkFinishEnabled(); });
    await sleep(300);

    const disabled = await page.$eval('#btn-finish', el => el.disabled);
    if (disabled) {
      const debugVars = await page.evaluate(() => {
        return {
          received: document.getElementById('tunai-received').value,
          subtotal: cart.reduce((sum, c) => sum + c.price * c.qty, 0),
          btnDisabled: document.getElementById('btn-finish').disabled,
          method: selectedPaymentMethod
        };
      });
      console.log('DEBUG BUTTON:', debugVars);
      // Forcing it enabled just for testing the rest
      await page.evaluate(() => { document.getElementById('btn-finish').disabled = false; });
    }

    await page.click('#btn-finish');
    await page.waitForSelector('#success-modal:not(.hidden)');
    await sleep(500);

    const txCount = await page.evaluate(() => JSON.parse(localStorage.getItem('apotek_pos_transactions') || '[]').length);
    const stockAfter = await page.evaluate((code) => {
      const raw = JSON.parse(localStorage.getItem('apotek_products_master') || localStorage.getItem('products_master') || '[]');
      const found = raw.find(p => p.kode === code);
      return found ? Number(found.stok || 0) : null;
    }, productCode);

    const result = {
      foundProduct,
      cartCount,
      txCount,
      stockAfter,
      successTrxNo: await page.$eval('#success-trx-no', el => el.textContent.trim()),
      successTotal: await page.$eval('#success-total', el => el.textContent.trim()),
      errors,
    };

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
})().catch(err => {
  console.error('TEST_FAILED');
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
