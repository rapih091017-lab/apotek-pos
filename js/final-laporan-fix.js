// FINAL LAPORAN FIX — comprehensive implementation (real data from localStorage)
(function() {
  'use strict';

  window.renderLaporan = function renderLaporan() {
    // ===== DATA SOURCES =====
    var txns = []; try { txns = JSON.parse(localStorage.getItem('apotek_pos_transactions') || '[]'); } catch(e) {}
    var products = []; try { products = JSON.parse(localStorage.getItem('apotek_products_master') || '[]'); } catch(e) {}
    var invoices = []; try { invoices = JSON.parse(localStorage.getItem('apotek_purchase_invoices') || '[]'); } catch(e) {}
    var contacts = []; try { contacts = JSON.parse(localStorage.getItem('apotek_kontak') || '[]'); } catch(e) {}

    // ===== DATE FILTER (from Penjualan sub-tab inputs) =====
    var penjualanDiv = document.getElementById('sub-laporan-penjualan');
    var startDate = new Date(); startDate.setDate(startDate.getDate() - 30);
    var endDate = new Date();
    if (penjualanDiv) {
      var inputs = penjualanDiv.querySelectorAll('input[type="date"]');
      if (inputs[0] && inputs[0].value) { var d = new Date(inputs[0].value); if (!isNaN(d)) startDate = d; }
      if (inputs[1] && inputs[1].value) { var d = new Date(inputs[1].value); if (!isNaN(d)) endDate = d; }
    }
    endDate.setHours(23,59,59,999);
    startDate.setHours(0,0,0,0);

    // ===== FILTER TRANSACTIONS =====
    var filtered = txns.filter(function(t) {
      if (t.status === 'void') return false;
      var d = new Date(t.created_at || t.tanggal);
      return d >= startDate && d <= endDate;
    });

    var totalRevenue = filtered.reduce(function(s, t) { return s + (parseInt(t.total) || parseInt(t.subtotal) || 0); }, 0);
    var totalTrx = filtered.length;
    var hariCount = Math.max(1, Math.ceil((endDate - startDate) / 86400000));

    // ===== REAL COGS & MARGIN (from products master) =====
    var totalCOGS = 0;
    var totalMargin = 0;
    var prodStats = {};  // { productName: { qty, revenue, margin, category } }

    filtered.forEach(function(t) {
      (t.items || []).forEach(function(item) {
        // Resolve product from master
        var prod = products.find(function(p) { return (p.kode || p.id) === (item.productId || item.kode); });
        var beli = parseInt(prod ? prod.harga_beli : 0) || 0;
        var jual = parseInt(item.price) || 0;
        var qty = parseInt(item.qty) || 0;
        totalCOGS += beli * qty;
        totalMargin += (jual - beli) * qty;

        // Resolve product name: item.name → product master → fallback
        var name = item.name;
        if (!name && prod) name = prod.nama_dagang || prod.nama || '';
        if (!name) name = 'Produk #' + (item.productId || item.kode || '?');
        var cat = prod ? (prod.golongan || prod.kategori || '-') : '-';

        if (!prodStats[name]) prodStats[name] = { qty: 0, revenue: 0, margin: 0, category: cat };
        prodStats[name].qty += qty;
        prodStats[name].revenue += jual * qty;
        prodStats[name].margin += (jual - beli) * qty;
      });
    });

    // ===== PURCHASE DATA =====
    var filteredInvoices = invoices.filter(function(i) {
      var d = new Date(i.tanggal || i.tanggal_faktur);
      return !isNaN(d) && d >= startDate && d <= endDate;
    });
    var totalBeli = filteredInvoices.reduce(function(s, i) { return s + (parseInt(i.total) || 0); }, 0);
    var totalFaktur = filteredInvoices.length;
    var sudahDibayar = filteredInvoices.reduce(function(s, i) { return s + (parseInt(i.dibayar) || 0); }, 0);
    var sisaHutang = filteredInvoices.reduce(function(s, i) { return s + ((parseInt(i.total) || 0) - (parseInt(i.dibayar) || 0)); }, 0);

    // ===== HELPERS =====
    function setVal(id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val;
    }
    function fmtRp(n) { return 'Rp ' + (n || 0).toLocaleString('id-ID'); }

    // ==========================================
    // 1. PENJUALAN SUB-TAB  (KPI + Journal Table)
    // ==========================================
    setVal('kpi-lap-penjualan', fmtRp(totalRevenue));
    setVal('kpi-lap-transaksi', String(totalTrx));
    setVal('kpi-lap-ratahari', fmtRp(Math.round(totalRevenue / hariCount)));
    setVal('kpi-lap-ratatrx', totalTrx ? fmtRp(Math.round(totalRevenue / totalTrx)) : 'Rp 0');
    setVal('kpi-lap-margin', fmtRp(totalMargin));

    // Build / refresh transaction journal (product names, not IDs)
    var journalContainer = document.getElementById('lap-journal-container');
    if (!journalContainer && penjualanDiv) {
      journalContainer = document.createElement('div');
      journalContainer.id = 'lap-journal-container';
      journalContainer.className = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 card-shadow overflow-hidden mt-4';
      journalContainer.innerHTML =
        '<div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700"><h3 class="font-semibold text-sm">📋 Jurnal Transaksi (' + totalTrx + ' transaksi)</h3></div>' +
        '<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">' +
        '<th class="px-4 py-3">Tanggal</th><th class="px-4 py-3">No</th><th class="px-4 py-3">Produk</th><th class="px-4 py-3">Qty</th><th class="px-4 py-3">Harga</th><th class="px-4 py-3">Total</th></tr></thead><tbody id="lap-journal-tbody"></tbody></table></div>';
      penjualanDiv.appendChild(journalContainer);
    }
    // Update header count
    if (journalContainer) {
      var jh3 = journalContainer.querySelector('h3');
      if (jh3) jh3.textContent = '📋 Jurnal Transaksi (' + totalTrx + ' transaksi)';
    }

    var tbody = document.getElementById('lap-journal-tbody');
    if (tbody) {
      var journalRows = [];
      var recentTxns = filtered.slice().reverse().slice(0, 30);
      recentTxns.forEach(function(t) {
        var tDate = new Date(t.created_at || t.tanggal);
        var dateStr = isNaN(tDate) ? '-' : tDate.toLocaleDateString('id', {day: 'numeric', month: 'short', year: 'numeric'});
        var trxNo = t.trx_no || t.id || '-';
        (t.items || []).forEach(function(item) {
          var prod = products.find(function(p) { return (p.kode || p.id) === (item.productId || item.kode); });
          var name = item.name || (prod ? (prod.nama_dagang || prod.nama || '') : '');
          if (!name) name = 'Produk #' + (item.productId || item.kode || '?');
          var qty = parseInt(item.qty) || 1;
          var price = parseInt(item.price) || 0;
          var lineTotal = price * qty;
          journalRows.push('<tr class="border-b border-gray-100 row-hover">' +
            '<td class="px-4 py-2 text-xs whitespace-nowrap">' + dateStr + '</td>' +
            '<td class="px-4 py-2 text-xs font-mono whitespace-nowrap">' + trxNo + '</td>' +
            '<td class="px-4 py-2 font-medium">' + name + '</td>' +
            '<td class="px-4 py-2 font-mono text-xs text-center">' + qty + '</td>' +
            '<td class="px-4 py-2 font-mono text-xs">' + fmtRp(price) + '</td>' +
            '<td class="px-4 py-2 font-mono text-xs">' + fmtRp(lineTotal) + '</td></tr>');
        });
      });
      tbody.innerHTML = journalRows.length
        ? journalRows.join('')
        : '<tr><td colspan="6" class="px-4 py-6 text-center text-gray-400">Tidak ada transaksi dalam rentang tanggal</td></tr>';
    }

    // ==========================================
    // 2. PRODUK SUB-TAB  (Top products by qty sold)
    // ==========================================
    var topProducts = Object.entries(prodStats).sort(function(a, b) { return b[1].qty - a[1].qty; }).slice(0, 10);
    var produkTable = document.querySelector('#sub-laporan-produk table tbody');
    if (produkTable) {
      if (topProducts.length) {
        produkTable.innerHTML = topProducts.map(function(e, i) {
          var s = e[1];
          return '<tr class="border-b border-gray-100 row-hover">' +
            '<td class="px-4 py-3 font-bold text-primary">' + (i + 1) + '</td>' +
            '<td class="px-4 py-3 font-medium">' + e[0] + '</td>' +
            '<td class="px-4 py-3">' + s.category + '</td>' +
            '<td class="px-4 py-3 font-mono">' + s.qty + '</td>' +
            '<td class="px-4 py-3 font-mono">' + fmtRp(s.revenue) + '</td>' +
            '<td class="px-4 py-3 font-mono text-green-700">' + fmtRp(s.margin) + '</td></tr>';
        }).join('');
      } else {
        produkTable.innerHTML = '<tr><td colspan="6" class="px-4 py-6 text-center text-gray-400">Belum ada produk terjual dalam rentang tanggal</td></tr>';
      }
    }

    // ==========================================
    // 3. PEMBELIAN SUB-TAB  (Purchase invoices)
    // ==========================================
    var pembelianDiv = document.getElementById('sub-laporan-pembelian');
    if (pembelianDiv) {
      var pCards = pembelianDiv.querySelectorAll('.card-shadow .font-mono');
      if (pCards[0]) pCards[0].textContent = fmtRp(totalBeli);
      if (pCards[1]) pCards[1].textContent = String(totalFaktur);
      if (pCards[2]) pCards[2].textContent = fmtRp(sudahDibayar);
      if (pCards[3]) pCards[3].textContent = fmtRp(sisaHutang);
    }

    // ==========================================
    // 4. PERSEDIAAN SUB-TAB  (Product stock)
    // ==========================================
    var persediaanDiv = document.getElementById('sub-laporan-persediaan');
    if (persediaanDiv) {
      var activeProducts = products.filter(function(p) { return p.is_aktif !== false; });
      var totalSKU = activeProducts.length;
      var nilaiStok = activeProducts.reduce(function(s, p) { return s + (parseInt(p.stok) || 0) * (parseInt(p.harga_beli) || 0); }, 0);
      var stokMenipis = activeProducts.filter(function(p) { return (parseInt(p.stok) || 0) > 0 && (parseInt(p.stok) || 0) <= (parseInt(p.stok_minimum) || 5); }).length;
      var stokHabis = activeProducts.filter(function(p) { return (parseInt(p.stok) || 0) === 0; }).length;

      var sCards = persediaanDiv.querySelectorAll('.card-shadow .font-mono');
      if (sCards[0]) sCards[0].textContent = String(totalSKU);
      if (sCards[1]) sCards[1].textContent = fmtRp(nilaiStok);
      if (sCards[2]) sCards[2].textContent = String(stokMenipis);
      if (sCards[3]) sCards[3].textContent = String(stokHabis);
    }

    // ==========================================
    // 5. KEUANGAN SUB-TAB  (Income / Expense / Profit)
    // ==========================================
    setVal('kpi-lap-pemasukan', fmtRp(totalRevenue));
    setVal('kpi-lap-pengeluaran', fmtRp(totalBeli));
    setVal('kpi-lap-laba', fmtRp(totalMargin));

    // ==========================================
    // 6. KADALUARSA SUB-TAB  (Expired products)
    // ==========================================
    var kadaluarsaDiv = document.getElementById('sub-laporan-kadaluarsa');
    if (kadaluarsaDiv) {
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var expired = products.filter(function(p) {
        var expStr = p.tanggal_kadaluarsa || p.exp_date || p.expired_date;
        if (!expStr) return false;
        var expDate = new Date(expStr);
        return !isNaN(expDate) && expDate < today && (parseInt(p.stok) || 0) > 0;
      });

      var h3 = kadaluarsaDiv.querySelector('h3');
      if (h3) h3.textContent = '🔴 Sudah Kadaluarsa (' + expired.length + ')';

      var kTbody = kadaluarsaDiv.querySelector('table tbody');
      if (kTbody) {
        if (expired.length) {
          kTbody.innerHTML = expired.map(function(p) {
            var expStr = p.tanggal_kadaluarsa || p.exp_date || p.expired_date || '-';
            var expDate = new Date(expStr);
            var expDisplay = isNaN(expDate) ? expStr : expDate.toLocaleDateString('id', {day: 'numeric', month: 'short', year: 'numeric'});
            return '<tr>' +
              '<td class="px-4 py-3 font-medium">' + (p.nama_dagang || p.nama || p.kode || '-') + '</td>' +
              '<td class="px-4 py-3">' + (p.batch || p.no_batch || '-') + '</td>' +
              '<td class="px-4 py-3 text-red-600">' + expDisplay + '</td>' +
              '<td class="px-4 py-3">' + (p.stok || 0) + ' ' + (p.satuan || 'pcs') + '</td></tr>';
          }).join('');
        } else {
          kTbody.innerHTML = '<tr><td colspan="4" class="px-4 py-6 text-center text-green-600">✅ Tidak ada produk kadaluarsa</td></tr>';
        }
      }
    }

    // ==========================================
    // 7. PELANGGAN SUB-TAB  (Customer stats)
    // ==========================================
    var pelangganDiv = document.getElementById('sub-laporan-pelanggan');
    if (pelangganDiv) {
      var custSet = {};
      var custTxns = {};
      var custNames = {};
      filtered.forEach(function(t) {
        var wa = t.customer_wa || '';
        var name = t.customer_name || '';
        if (wa) {
          custSet[wa] = true;
          custTxns[wa] = (custTxns[wa] || 0) + 1;
          if (name && !custNames[wa]) custNames[wa] = name;
        }
      });
      var totalPelanggan = Object.keys(custSet).length;
      var members = Object.values(custTxns).filter(function(c) { return c > 1; }).length;

      var monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      var newCustSet = {};
      txns.filter(function(t) { return new Date(t.created_at || t.tanggal) >= monthStart && t.status !== 'void'; })
        .forEach(function(t) {
          var wa = t.customer_wa || '';
          if (wa) newCustSet[wa] = true;
        });
      var baruBulanIni = Object.keys(newCustSet).length;
      var totalPoin = Object.values(custTxns).reduce(function(s, c) { return s + c; }, 0);

      var plCards = pelangganDiv.querySelectorAll('.card-shadow .font-mono');
      if (plCards[0]) plCards[0].textContent = String(totalPelanggan);
      if (plCards[1]) plCards[1].textContent = String(members);
      if (plCards[2]) plCards[2].textContent = String(baruBulanIni);
      if (plCards[3]) plCards[3].textContent = String(totalPoin);
    }

    console.log('📊 renderLaporan: ' + totalTrx + ' trx, revenue ' + fmtRp(totalRevenue) + ', margin ' + fmtRp(totalMargin));
    return true;
  };

  // ===== BIND "Tampilkan" BUTTON + TAB OBSERVER =====
  var INTERVAL = 700;
  var attempts = 0;
  var timer = setInterval(function() {
    attempts++;
    var done = true;

    // Bind "Tampilkan" button in Laporan tab
    var btns = document.querySelectorAll('button');
    var bound = false;
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].textContent.indexOf('Tampilkan') >= 0 && !btns[i].dataset.bnd) {
        btns[i].addEventListener('click', function() { window.renderLaporan(); });
        btns[i].dataset.bnd = '1';
        console.log('✅ Tombol "Tampilkan" terikat — klik untuk update laporan');
        bound = true;
      }
    }

    // Set up MutationObserver on tab-laporan
    if (!window.__laporanObserverSet) {
      var tab = document.getElementById('tab-laporan');
      if (tab) {
        new MutationObserver(function(ms) {
          ms.forEach(function(m) {
            if (!m.target.classList.contains('hidden')) {
              setTimeout(function() { window.renderLaporan(); }, 300);
            }
          });
        }).observe(tab, { attributes: true, attributeFilter: ['class'] });
        window.__laporanObserverSet = true;
        console.log('✅ Observer Laporan tab aktif');
      } else {
        done = false;
      }
    }

    if (done && bound && attempts > 15) clearInterval(timer);
    if (attempts > 30) { clearInterval(timer); console.warn('Laporan fix: timeout setelah ' + (attempts * INTERVAL / 1000) + 's'); }
  }, INTERVAL);

  console.log('📊 final-laporan-fix.js LOADED — comprehensive implementation');
})();
