// ==============================================================================
// ApotekPOS — Supabase Bridge (Dual-Mode Data Layer)
// 
// Mode: localStorage (default) atau Supabase (production)
// Tukar mode: localStorage.setItem('apotek_pos_backend', 'supabase')
//              localStorage.setItem('apotek_pos_backend', 'local')
// ==============================================================================

window.ApotekDB = (function() {
  'use strict';

  var USE_SUPABASE = false;
  var supabase = null;

  // ===== INIT =====
  function init(config) {
    config = config || {};
    if (localStorage.getItem('apotek_pos_backend') === 'supabase' && config.supabaseUrl && config.supabaseKey) {
      try {
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
          supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);
          USE_SUPABASE = true;
          console.log('[ApotekDB] Mode: Supabase');
          return true;
        }
      } catch(e) {
        console.warn('[ApotekDB] Supabase SDK not loaded, using localStorage');
      }
    }
    console.log('[ApotekDB] Mode: localStorage');
    return false;
  }

  function isSupabase() { return USE_SUPABASE && supabase !== null; }

  function getTenant() {
    return localStorage.getItem('apotek_pos_tenant_id') || '00000000-0000-0000-0000-000000000000';
  }

  // ===== GENERIC CRUD =====
  function from(table) {
    if (isSupabase()) return supabase.from(table);
    return new LocalTable(table);
  }

  // LocalStorage fallback table adapter
  function LocalTable(name) {
    this.name = name;
    this.storageKey = 'apotek_' + name;
  }

  LocalTable.prototype._all = function() {
    try { return JSON.parse(localStorage.getItem(this.storageKey)) || []; } catch(e) { return []; }
  };

  LocalTable.prototype._save = function(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  };

  LocalTable.prototype.select = function(cols) {
    var rows = this._all();
    var name = this.name;
    var sk = this.storageKey;
    return {
      eq: function(col, val) {
        var filtered = rows.filter(function(r) { return r[col] === val; });
        return { data: filtered, error: null, then: function(cb) { cb({ data: filtered, error: null }); } };
      },
      order: function(col, opts) {
        var sorted = rows.slice().sort(function(a,b) {
          return opts && opts.ascending === false ? (b[col]||0) - (a[col]||0) : (a[col]||0) - (b[col]||0);
        });
        return { data: sorted, error: null, then: function(cb) { cb({ data: sorted, error: null }); } };
      },
      range: function(from, to) {
        return { data: rows.slice(from, to+1), error: null, then: function(cb) { cb({ data: rows.slice(from, to+1), error: null }); } };
      },
      then: function(cb) { cb({ data: rows, error: null }); },
      data: rows,
      error: null
    };
  };

  LocalTable.prototype.insert = function(items) {
    var all = this._all();
    var itemsArr = Array.isArray(items) ? items : [items];
    itemsArr.forEach(function(item) {
      if (!item.id) item.id = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2,6);
      if (!item.created_at) item.created_at = new Date().toISOString();
      all.push(item);
    });
    this._save(all);
    return Promise.resolve({ data: itemsArr, error: null });
  };

  LocalTable.prototype.update = function(updates) {
    var all = this._all();
    return {
      eq: function(col, val) {
        all = all.map(function(r) {
          if (r[col] === val) { for (var k in updates) r[k] = updates[k]; r.updated_at = new Date().toISOString(); }
          return r;
        });
        return Promise.resolve({ data: all.filter(function(r) { return r[col] === val; }), error: null });
      }
    };
  };

  LocalTable.prototype.upsert = function(items, opts) {
    var all = this._all();
    var itemsArr = Array.isArray(items) ? items : [items];
    itemsArr.forEach(function(item) {
      var idx = all.findIndex(function(r) { return r.id === item.id; });
      if (idx >= 0) {
        for (var k in item) all[idx][k] = item[k];
        all[idx].updated_at = new Date().toISOString();
      } else {
        if (!item.id) item.id = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2,6);
        if (!item.created_at) item.created_at = new Date().toISOString();
        all.push(item);
      }
    });
    this._save(all);
    return Promise.resolve({ data: itemsArr, error: null });
  };

  LocalTable.prototype.delete = function() {
    var all = this._all();
    var sk = this.storageKey;
    return {
      eq: function(col, val) {
        var filtered = all.filter(function(r) { return r[col] !== val; });
        localStorage.setItem(sk, JSON.stringify(filtered));
        return Promise.resolve({ data: null, error: null });
      }
    };
  };

  // ===== SPECIFIC API METHODS =====

  // --- Products ---
  function getProducts() {
    if (isSupabase()) return supabase.from('products').select('*, product_units(*), product_suppliers(*, suppliers(*))').eq('tenant_id', getTenant()).eq('is_aktif', true);
    return from('products_master').select();
  }

  function saveProduct(product) {
    if (isSupabase()) return supabase.from('products').upsert(product);
    return from('products_master').upsert(product);
  }

  // --- Units ---
  function getUnits() {
    if (isSupabase()) return supabase.from('units').select('*').eq('tenant_id', getTenant());
    return from('pos_units').select();
  }

  function saveUnits(units) {
    var all = [];
    try { all = JSON.parse(localStorage.getItem('apotek_pos_units')); } catch(e) {}
    all = all.concat(units);
    localStorage.setItem('apotek_pos_units', JSON.stringify(all));
    return Promise.resolve({ data: all, error: null });
  }

  // --- Suppliers ---
  function getSuppliers() {
    if (isSupabase()) return supabase.from('suppliers').select('*').eq('tenant_id', getTenant()).eq('is_aktif', true);
    return from('pos_suppliers').select();
  }

  // --- Contacts ---
  function getContacts(tipe) {
    var query = isSupabase() ?
      supabase.from('contacts').select('*').eq('tenant_id', getTenant()).eq('is_aktif', true) :
      from('kontak').select();
    if (tipe && isSupabase()) return query.eq('tipe', tipe);
    return query;
  }

  // --- Transactions ---
  function getTransactions(opts) {
    opts = opts || {};
    if (isSupabase()) {
      var q = supabase.from('sales_transactions').select('*, items:sales_transaction_items(*)').eq('tenant_id', getTenant()).order('created_at', {ascending: false});
      if (opts.limit) q = q.limit(opts.limit);
      return q;
    }
    var txns = [];
    try { txns = JSON.parse(localStorage.getItem('apotek_pos_transactions')) || []; } catch(e) {}
    if (opts.limit) txns = txns.slice(0, opts.limit);
    return { data: txns, error: null, then: function(cb) { cb({ data: txns, error: null }); } };
  }

  function saveTransaction(trx) {
    if (isSupabase()) return supabase.from('sales_transactions').insert(trx);
    var txns = [];
    try { txns = JSON.parse(localStorage.getItem('apotek_pos_transactions')) || []; } catch(e) {}
    txns.unshift(trx);
    if (txns.length > 200) txns = txns.slice(0, 200);
    localStorage.setItem('apotek_pos_transactions', JSON.stringify(txns));
    return Promise.resolve({ data: trx, error: null });
  }

  // --- Purchase Orders ---
  function getPurchaseOrders() {
    if (isSupabase()) return supabase.from('purchase_orders').select('*, items:purchase_order_items(*)').eq('tenant_id', getTenant()).order('created_at', {ascending: false});
    return from('purchase_orders').select();
  }

  function savePurchaseOrder(po) {
    if (isSupabase()) return supabase.from('purchase_orders').upsert(po);
    return from('purchase_orders').upsert(po);
  }

  // FIX: Purchase Invoice CRUD — previously missing, needed by Pembelian module
  function savePurchaseInvoice(inv) {
    inv.tenant_id = getTenant();
    if (isSupabase()) return supabase.from('purchase_invoices').upsert(inv);
    return from('purchase_invoices').upsert(inv);
  }

  function getPurchaseInvoices(opts) {
    opts = opts || {};
    if (isSupabase()) {
      var q = supabase.from('purchase_invoices').select('*, items:purchase_invoice_items(*)').eq('tenant_id', getTenant()).order('created_at', {ascending: false});
      if (opts.limit) q = q.limit(opts.limit);
      return q;
    }
    return from('purchase_invoices').select();
  }

  // --- Defecta ---
  function getDefecta() {
    if (isSupabase()) return supabase.from('defecta_list').select('*').eq('tenant_id', getTenant());
    return from('products_master').select();
  }

  // --- Shift ---
  function getActiveShift(userId) {
    if (isSupabase()) return supabase.from('shifts').select('*').eq('tenant_id', getTenant()).eq('kasir_id', userId).eq('status', 'aktif').limit(1);
    var active = localStorage.getItem('apotek_pos_shift_active');
    if (active === 'true') return { data: [{ id: 'local_shift', status: 'aktif' }], error: null };
    return { data: [], error: null };
  }

  // --- Batches (FEFO) ---
  function getFEFOBatches(productId, outletId) {
    if (isSupabase()) return supabase.from('product_batches').select('*').eq('tenant_id', getTenant()).eq('product_id', productId).eq('outlet_id', outletId).gt('stok', 0).order('tanggal_kadaluarsa', {ascending: true});
    return { data: [], error: null, then: function(cb) { cb({ data: [], error: null }); } };
  }

  // --- Stock Mutations ---
  function insertStockMutation(mut) {
    mut.tenant_id = getTenant();
    if (isSupabase()) return supabase.from('stock_mutations').insert(mut);
    return Promise.resolve({ data: mut, error: null });
  }

  // --- Templates WA (Marketing) ---
  function getWATemplates() {
    if (isSupabase()) return from('wa_templates').select();
    var tpls = [];
    try { tpls = JSON.parse(localStorage.getItem('apotek_pos_wa_templates')) || []; } catch(e) {}
    return { data: tpls, error: null, then: function(cb) { cb({ data: tpls, error: null }); } };
  }

  function saveWATemplate(tpl) {
    if (isSupabase()) return from('wa_templates').upsert(tpl);
    var tpls = [];
    try { tpls = JSON.parse(localStorage.getItem('apotek_pos_wa_templates')) || []; } catch(e) {}
    var idx = tpls.findIndex(function(t) { return t.id === tpl.id; });
    if (idx >= 0) tpls[idx] = tpl;
    else tpls.push(tpl);
    localStorage.setItem('apotek_pos_wa_templates', JSON.stringify(tpls));
    return Promise.resolve({ data: tpl, error: null });
  }

  // --- Follow-ups (Marketing) ---
  function getFollowups(opts) {
    if (isSupabase()) return from('followups').select();
    var fus = [];
    try { fus = JSON.parse(localStorage.getItem('apotek_pos_followups')) || []; } catch(e) {}
    return { data: fus, error: null, then: function(cb) { cb({ data: fus, error: null }); } };
  }

  function saveFollowup(fu) {
    if (isSupabase()) return from('followups').upsert(fu);
    var fus = [];
    try { fus = JSON.parse(localStorage.getItem('apotek_pos_followups')) || []; } catch(e) {}
    fus.unshift(fu);
    localStorage.setItem('apotek_pos_followups', JSON.stringify(fus));
    return Promise.resolve({ data: fu, error: null });
  }

  // --- Promos (Marketing) ---
  function getPromos() {
    if (isSupabase()) return from('promos').select();
    var promos = [];
    try { promos = JSON.parse(localStorage.getItem('apotek_pos_promos')) || []; } catch(e) {}
    return { data: promos, error: null, then: function(cb) { cb({ data: promos, error: null }); } };
  }

  function savePromo(promo) {
    if (isSupabase()) return from('promos').upsert(promo);
    var promos = [];
    try { promos = JSON.parse(localStorage.getItem('apotek_pos_promos')) || []; } catch(e) {}
    var idx = promos.findIndex(function(p) { return p.id === promo.id; });
    if (idx >= 0) promos[idx] = promo;
    else promos.unshift(promo);
    localStorage.setItem('apotek_pos_promos', JSON.stringify(promos));
    return Promise.resolve({ data: promo, error: null });
  }

  // --- Profile ---
  function getProfile() {
    return {
      nama: localStorage.getItem('apotek_pos_profile_name') || 'Apotek Sehat Sentosa',
      outlet: localStorage.getItem('apotek_pos_outlet') || 'Outlet Pusat',
      alamat: localStorage.getItem('apotek_pos_alamat') || '',
      telepon: localStorage.getItem('apotek_pos_telepon') || '',
      footer: localStorage.getItem('apotek_pos_footer') || 'Terima Kasih — Obat yang sudah dibeli tidak dapat ditukar'
    };
  }

  function saveProfile(profile) {
    if (profile.nama) localStorage.setItem('apotek_pos_profile_name', profile.nama);
    if (profile.outlet) localStorage.setItem('apotek_pos_outlet', profile.outlet);
    if (profile.alamat) localStorage.setItem('apotek_pos_alamat', profile.alamat);
    if (profile.telepon) localStorage.setItem('apotek_pos_telepon', profile.telepon);
    if (profile.footer) localStorage.setItem('apotek_pos_footer', profile.footer);
    return Promise.resolve({ data: profile, error: null });
  }

  // --- Auth (placeholder — Supabase Auth not yet integrated) ---
  function getSession() {
    return Promise.resolve({ data: { session: isSupabase() ? supabase.auth.session() : null }, error: null });
  }

  function login(email, password) {
    if (isSupabase()) return supabase.auth.signInWithPassword({ email: email, password: password });
    return Promise.resolve({ data: { user: { email: email } }, error: null });
  }

  function logout() {
    if (isSupabase()) return supabase.auth.signOut();
    localStorage.removeItem('apotek_pos_logged_in');
    localStorage.removeItem('apotek_pos_shift_active');
    return Promise.resolve({ error: null });
  }

  // ===== PUBLIC API =====
  return {
    init: init,
    isSupabase: isSupabase,
    getTenant: getTenant,
    from: from,
    // Products
    getProducts: getProducts,
    saveProduct: saveProduct,
    // Units
    getUnits: getUnits,
    saveUnits: saveUnits,
    // Suppliers
    getSuppliers: getSuppliers,
    // Contacts
    getContacts: getContacts,
    // Transactions
    getTransactions: getTransactions,
    saveTransaction: saveTransaction,
    // Purchase Orders
    getPurchaseOrders: getPurchaseOrders,
    savePurchaseOrder: savePurchaseOrder,
    // FIX: Purchase Invoices — previously missing
    savePurchaseInvoice: savePurchaseInvoice,
    getPurchaseInvoices: getPurchaseInvoices,
    // Defecta
    getDefecta: getDefecta,
    // Shift
    getActiveShift: getActiveShift,
    // Batches (FEFO)
    getFEFOBatches: getFEFOBatches,
    // Stock Mutations
    insertStockMutation: insertStockMutation,
    // Marketing
    getWATemplates: getWATemplates,
    saveWATemplate: saveWATemplate,
    getFollowups: getFollowups,
    saveFollowup: saveFollowup,
    getPromos: getPromos,
    savePromo: savePromo,
    // Profile
    getProfile: getProfile,
    saveProfile: saveProfile,
    // Auth
    getSession: getSession,
    login: login,
    logout: logout
  };

  // ===== SAFE STORAGE HELPER =====
  function safeSetItem(key, value) {
    try { localStorage.setItem(key, value); return true; }
    catch(e) {
      if (e.name === 'QuotaExceededError') {
        // Evict oldest data: clear transactions older than 90 days
        try {
          var txns = JSON.parse(localStorage.getItem('apotek_pos_transactions') || '[]');
          var cutoff = Date.now() - 90*86400000;
          txns = txns.filter(function(t) { return new Date(t.created_at).getTime() > cutoff; });
          localStorage.setItem('apotek_pos_transactions', JSON.stringify(txns));
          localStorage.setItem(key, value);
          return true;
        } catch(e2) { return false; }
      }
      return false;
    }
  }

  // ===== SUPABASE → LOCALSTORAGE SYNC =====
  function syncFromSupabase() {
    if (!isSupabase()) return;
    console.log('[ApotekDB] Syncing...');
    // Products
    supabase.from('products').select('*').eq('tenant_id', getTenant()).then(function(r) {
      if (!r.error && r.data) {
        var mapped = r.data.map(function(p) { return {
          id: p.id, kode: p.kode_produk, nama_dagang: p.nama_dagang, nama_generik: p.nama_generik,
          golongan: p.golongan, kategori: p.kategori_id||'Obat', satuan: p.satuan_dasar_id||'Pcs',
          harga_beli: p.harga_beli||0, harga_jual: p.harga_jual||0, stok: p.stok||0, stok_minimum: p.stok_minimum||5,
          is_aktif: p.is_aktif!==false, produsen: p.produsen||'', lead_time: p.lead_time_days||3
        };});
        localStorage.setItem('apotek_products_master', JSON.stringify(mapped));
        localStorage.setItem('products_master', JSON.stringify(mapped));
        console.log('[ApotekDB] Synced '+mapped.length+' products');
      }
    });
    // Transactions
    supabase.from('sales_transactions').select('*').eq('tenant_id', getTenant()).order('created_at',{ascending:false}).limit(50).then(function(r) {
      if (!r.error && r.data) localStorage.setItem('apotek_pos_transactions', JSON.stringify(r.data));
    });
    // Contacts
    supabase.from('contacts').select('*').eq('tenant_id', getTenant()).then(function(r) {
      if (!r.error && r.data) localStorage.setItem('apotek_kontak', JSON.stringify(r.data));
    });
    // Purchase Orders
    supabase.from('purchase_orders').select('*').eq('tenant_id', getTenant()).then(function(r) {
      if (!r.error && r.data) localStorage.setItem('apotek_purchase_orders', JSON.stringify(r.data));
    });
    // Invoices
    supabase.from('purchase_invoices').select('*').eq('tenant_id', getTenant()).then(function(r) {
      if (!r.error && r.data) localStorage.setItem('apotek_purchase_invoices', JSON.stringify(r.data));
    });
  }

})();

// ===== Auto-init when loaded in browser =====
if (typeof window !== 'undefined' && !window.ApotekDB._initialized) {
  window.ApotekDB._initialized = true;
  
  // Set default URL from user
  if(!localStorage.getItem('apotek_pos_supabase_url')) {
      localStorage.setItem('apotek_pos_supabase_url', 'https://atpfeizvqcvufrdigzfp.supabase.co');
  }
  
  window.ApotekDB.init({
    supabaseUrl: localStorage.getItem('apotek_pos_supabase_url') || '',
    supabaseKey: localStorage.getItem('apotek_pos_supabase_key') || ''
  });
  // Sync Supabase → localStorage after init
  setTimeout(function() { syncFromSupabase(); }, 300);
  
  // Hook: localStorage → Supabase sync on every save (2-arah)
  var _origSetItem = localStorage.setItem;
  var _syncing = false;
  localStorage.setItem = function(key, value) {
    _origSetItem.apply(this, arguments);
    if (_syncing || !window.ApotekDB.isSupabase()) return;
    _syncing = true;
    try {
      var data = JSON.parse(value);
      if (key === 'apotek_products_master' || key === 'products_master') {
        data.forEach(function(p) {
          window.ApotekDB.saveProduct(p);
        });
      } else if (key === 'apotek_pos_transactions') {
        var last = data[0]; // newest transaction
        if (last) window.ApotekDB.saveTransaction(last);
      } else if (key === 'apotek_purchase_orders') {
        data.forEach(function(po) { window.ApotekDB.savePurchaseOrder(po); });
      }
    } catch(e) {}
    setTimeout(function() { _syncing = false; }, 100);
  };
  console.log('[ApotekDB] 2-way sync active: localStorage ↔ Supabase');
}