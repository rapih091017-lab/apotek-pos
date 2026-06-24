// ==============================================================================
// ApotekPOS — Product Schema (Shared Data Layer)
// Semua modul wajib pakai ini untuk baca/tulis data produk
// ==============================================================================

window.ProductDB = (function() {
  'use strict';

  var STORAGE_KEY = 'apotek_products_master';
  var LEGACY_KEY = 'products_master';

  // ===== CANONICAL PRODUCT SCHEMA =====
  // Semua produk setelah normalisasi akan punya field ini:
  // { id, kode, nama_dagang, nama_generik, golongan, kategori, satuan,
  //   harga_beli, harga_jual, stok, stok_minimum, is_aktif, is_konsinyasi,
  //   produsen, image, barcode }

  var DEFAULT_IMAGE = '💊';

  function normalizeProduct(raw) {
    if (!raw) return null;
    return {
      id: raw.id || raw.kode || ('prod-' + Date.now() + '-' + Math.random().toString(36).substr(2,4)),
      kode: raw.kode || raw.id || '',
      nama_dagang: raw.nama_dagang || raw.nama || raw.name || 'Tanpa Nama',
      nama_generik: raw.nama_generik || '',
      golongan: raw.golongan || raw.category || 'bebas',
      kategori: raw.kategori || raw.golongan || 'Umum',
      satuan: raw.satuan || 'Pcs',
      harga_beli: Number(raw.harga_beli || raw.harga_beli_estimasi || 0),
      harga_jual: Number(raw.harga_jual || raw.price || 0),
      stok: Number(raw.stok || raw.stok_total || raw.stock || 0),
      stok_minimum: Number(raw.stok_minimum || raw.min || 5),
      is_aktif: raw.is_aktif !== false,
      is_konsinyasi: raw.is_konsinyasi || false,
      produsen: raw.produsen || '',
      image: raw.image || DEFAULT_IMAGE,
      barcode: raw.barcode || ''
    };
  }

  // ===== READ =====
  function getAllProducts() {
    var raw = [];
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) raw = JSON.parse(stored);
      else {
        stored = localStorage.getItem(LEGACY_KEY);
        if (stored) raw = JSON.parse(stored);
      }
    } catch(e) { raw = []; }
    if (!Array.isArray(raw) || raw.length === 0) return getDefaults();
    return raw.map(normalizeProduct).filter(function(p) { return p.is_aktif; });
  }

  function getAllProductsIncludingInactive() {
    var raw = [];
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) raw = JSON.parse(stored);
      else {
        stored = localStorage.getItem(LEGACY_KEY);
        if (stored) raw = JSON.parse(stored);
      }
    } catch(e) { raw = []; }
    if (!Array.isArray(raw) || raw.length === 0) return getDefaults();
    return raw.map(normalizeProduct);
  }

  // ===== WRITE =====
  function saveProducts(products) {
    var json = JSON.stringify(products);
    localStorage.setItem(STORAGE_KEY, json);
    localStorage.setItem(LEGACY_KEY, json);
  }

  function updateProduct(productId, updates) {
    var all = getAllProductsIncludingInactive();
    var idx = all.findIndex(function(p) { return p.id === productId || p.kode === productId; });
    if (idx >= 0) {
      all[idx] = Object.assign({}, all[idx], updates);
    } else {
      all.push(normalizeProduct(Object.assign({ id: productId }, updates)));
    }
    saveProducts(all);
    return all;
  }

  function addProduct(product) {
    var all = getAllProductsIncludingInactive();
    var normalized = normalizeProduct(product);
    all.unshift(normalized);
    saveProducts(all);
    return normalized;
  }

  function toggleActive(productId) {
    var all = getAllProductsIncludingInactive();
    var idx = all.findIndex(function(p) { return p.id === productId || p.kode === productId; });
    if (idx >= 0) {
      all[idx].is_aktif = !all[idx].is_aktif;
      saveProducts(all);
      return all[idx];
    }
    return null;
  }

  function reduceStock(productId, qty) {
    var all = getAllProductsIncludingInactive();
    var idx = all.findIndex(function(p) { return p.id === productId || p.kode === productId; });
    if (idx >= 0) {
      all[idx].stok = Math.max(0, (all[idx].stok || 0) - qty);
      saveProducts(all);
      return all[idx];
    }
    return null;
  }

  // ===== FEFO BATCH =====
  function getBatchesForProduct(productId) {
    var all = [];
    try { all = JSON.parse(localStorage.getItem('apotek_pos_batches') || '[]'); } catch(e) {}
    var kode = productId;
    var prod = findProduct(productId);
    if (prod) kode = prod.kode || prod.id || productId;
    // Filter batches for this product, sort by earliest expiry (FEFO)
    return all.filter(function(b) {
      return (b.produk || b.product_id || b.kode || '') === kode ||
             (b.produk || '').toLowerCase() === (prod ? (prod.nama_dagang || prod.nama || '').toLowerCase() : '') ||
             (b.product_kode || '') === kode;
    }).sort(function(a, b) {
      return new Date(a.tanggal_kadaluarsa || a.expiry || '2099-12-31') - new Date(b.tanggal_kadaluarsa || b.expiry || '2099-12-31');
    });
  }

  function reduceStockFEFO(productId, qty) {
    var remaining = qty;
    var batches = getBatchesForProduct(productId);
    var deducted = [];
    // FEFO: deduct from earliest expiry first
    for (var i = 0; i < batches.length && remaining > 0; i++) {
      var b = batches[i];
      var available = parseInt(b.qty) || 0;
      if (available <= 0) continue;
      var take = Math.min(remaining, available);
      b.qty = available - take;
      remaining -= take;
      deducted.push({ batch: b.nomor_batch || b.id, expiry: b.tanggal_kadaluarsa, taken: take });
    }
    // If still remaining after all batches, take from flat stock (FEFO fallback)
    if (remaining > 0) {
      var all = getAllProductsIncludingInactive();
      var idx = all.findIndex(function(p) { return p.id === productId || p.kode === productId; });
      if (idx >= 0) {
        all[idx].stok = Math.max(0, (all[idx].stok || 0) - remaining);
        saveProducts(all);
      }
    }
    // Save updated batches
    var allBatches = [];
    try { allBatches = JSON.parse(localStorage.getItem('apotek_pos_batches') || '[]'); } catch(e) {}
    batches.forEach(function(b) {
      var idx = allBatches.findIndex(function(ab) { return (ab.id || ab.nomor_batch) === (b.id || b.nomor_batch); });
      if (idx >= 0) allBatches[idx].qty = b.qty;
    });
    localStorage.setItem('apotek_pos_batches', JSON.stringify(allBatches));
    return { deducted: deducted, remaining: remaining };
  }

  function findProduct(productId) {
    var all = getAllProductsIncludingInactive();
    return all.find(function(p) { return p.id === productId || p.kode === productId; });
  }

  // ===== DEFAULTS =====
  function getDefaults() {
    return [
      { id:'PROD-001', kode:'PRC-001', nama_dagang:'Paracetamol 500mg', nama_generik:'Paracetamol', golongan:'bebas', kategori:'Obat Bebas', satuan:'Strip', harga_beli:3500, harga_jual:5000, stok:100, stok_minimum:10, is_aktif:true, produsen:'Kimia Farma', image:'💊' },
      { id:'PROD-002', kode:'AMX-001', nama_dagang:'Amoxicillin 500mg', nama_generik:'Amoxicillin', golongan:'keras', kategori:'Antibiotik', satuan:'Kapsul', harga_beli:8000, harga_jual:12000, stok:50, stok_minimum:5, is_aktif:true, produsen:'Dexa Medica', image:'💊' },
      { id:'PROD-003', kode:'VTC-001', nama_dagang:'Vitamin C 500mg', nama_generik:'Ascorbic Acid', golongan:'vitamin', kategori:'Vitamin', satuan:'Tablet', harga_beli:5500, harga_jual:8000, stok:80, stok_minimum:8, is_aktif:true, produsen:'Kalbe Farma', image:'💊' },
      { id:'PROD-004', kode:'CTZ-001', nama_dagang:'Cetirizine 10mg', nama_generik:'Cetirizine', golongan:'keras', kategori:'Antihistamin', satuan:'Tablet', harga_beli:4500, harga_jual:7000, stok:60, stok_minimum:6, is_aktif:true, produsen:'Sanbe Farma', image:'💊' },
      { id:'PROD-005', kode:'OBH-001', nama_dagang:'OBH Combi 100ml', nama_generik:'OBH', golongan:'bebas_terbatas', kategori:'Batuk', satuan:'Botol', harga_beli:10000, harga_jual:15000, stok:40, stok_minimum:5, is_aktif:true, produsen:'Combiphar', image:'🧴' },
      { id:'PROD-006', kode:'BET-001', nama_dagang:'Betadine Sol. 60ml', nama_generik:'Povidone Iodine', golongan:'bebas', kategori:'Antiseptik', satuan:'Botol', harga_beli:18000, harga_jual:25000, stok:25, stok_minimum:3, is_aktif:true, produsen:'Mediasept', image:'🧴', is_konsinyasi:true },
      { id:'PROD-007', kode:'ANT-001', nama_dagang:'Antasida DOEN', nama_generik:'Antasida', golongan:'bebas', kategori:'Lambung', satuan:'Strip', harga_beli:2500, harga_jual:4000, stok:120, stok_minimum:12, is_aktif:true, produsen:'Kimia Farma', image:'💊' },
      { id:'PROD-008', kode:'DIA-001', nama_dagang:'Diapet 10mg', nama_generik:'Loperamide', golongan:'bebas_terbatas', kategori:'Diare', satuan:'Strip', harga_beli:3500, harga_jual:6000, stok:35, stok_minimum:4, is_aktif:true, produsen:'Kalbe Farma', image:'💊' },
      { id:'PROD-009', kode:'IMP-001', nama_dagang:'Imboost Tab', nama_generik:'Echinacea', golongan:'bebas', kategori:'Imun', satuan:'Strip', harga_beli:25000, harga_jual:35000, stok:20, stok_minimum:3, is_aktif:true, produsen:'Soho', image:'💊' },
      { id:'PROD-010', kode:'GLU-001', nama_dagang:'Glucophage 500mg', nama_generik:'Metformin', golongan:'keras', kategori:'Diabetes', satuan:'Strip', harga_beli:12000, harga_jual:18000, stok:30, stok_minimum:4, is_aktif:true, produsen:'Merck', image:'💊' }
    ];
  }

  // ===== PUBLIC API =====
  return {
    getAll: getAllProducts,
    getAllIncInactive: getAllProductsIncludingInactive,
    save: saveProducts,
    add: addProduct,
    update: updateProduct,
    toggleActive: toggleActive,
    reduceStock: reduceStock,
    getBatchesForProduct: getBatchesForProduct,
    reduceStockFEFO: reduceStockFEFO,
    normalize: normalizeProduct,
    getDefaults: getDefaults
  };

})();
