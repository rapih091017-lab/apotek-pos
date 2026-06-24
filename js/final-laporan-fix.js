// FINAL LAPORAN FIX — inline approach, self-healing
(function() {
  'use strict';
  var INTERVAL = 700;
  var attempts = 0;

  function renderLaporan() {
    var d = document.getElementById('sub-laporan-penjualan');
    if (!d) return false;
    var inp = d.querySelectorAll('input[type="date"]');
    var t1 = (inp[0] && inp[0].value) ? new Date(inp[0].value) : new Date();
    if (!inp[0] || !inp[0].value) t1.setDate(t1.getDate() - 30);
    var t2 = (inp[1] && inp[1].value) ? new Date(inp[1].value) : new Date();
    
    var txns = []; try { txns = JSON.parse(localStorage.getItem('apotek_pos_transactions') || '[]'); } catch(e) {}
    var filt = txns.filter(function(t) {
      var dt = new Date(t.created_at || t.tanggal);
      return dt >= t1 && dt <= t2;
    });
    
    var total = filt.reduce(function(s, t) { return s + (parseInt(t.total) || 0); }, 0);
    var n = filt.length;
    var hari = Math.max(1, Math.ceil((t2 - t1) / 86400000));
    var beli = 0;
    try {
      var invs = JSON.parse(localStorage.getItem('apotek_purchase_invoices') || '[]');
      beli = invs.filter(function(i) {
        var dt = new Date(i.tanggal || i.tanggal_faktur);
        return dt >= t1 && dt <= t2;
      }).reduce(function(s, i) { return s + (i.total || 0); }, 0);
    } catch(e) {}
    
    // First: force-add IDs if missing
    var cards = d.querySelectorAll('.card-shadow');
    var labels = ['Total Penjualan', 'Total Transaksi', 'Rata', 'Total Margin'];
    var ids = ['kpi-lap-penjualan', 'kpi-lap-transaksi', 'kpi-lap-ratahari', 'kpi-lap-ratatrx', 'kpi-lap-margin'];
    cards.forEach(function(card) {
      var labelEl = card.querySelector('p:first-child');
      if (!labelEl) return;
      var label = labelEl.textContent || '';
      var valEl = card.querySelector('.font-mono, .font-bold');
      if (!valEl) return;
      for (var j = 0; j < labels.length; j++) {
        if (label.indexOf(labels[j]) >= 0 && !valEl.id) valEl.id = ids[j];
      }
    });
    
    // Then: set values
    function setVal(id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val;
    }
    setVal('kpi-lap-penjualan', 'Rp ' + total.toLocaleString('id-ID'));
    setVal('kpi-lap-transaksi', String(n));
    setVal('kpi-lap-ratahari', 'Rp ' + Math.round(total / hari).toLocaleString('id-ID'));
    setVal('kpi-lap-ratatrx', n ? 'Rp ' + Math.round(total / n).toLocaleString('id-ID') : 'Rp 0');
    setVal('kpi-lap-margin', 'Rp ' + Math.round(total * 0.25).toLocaleString('id-ID'));
    setVal('kpi-lap-pemasukan', 'Rp ' + total.toLocaleString('id-ID'));
    setVal('kpi-lap-pengeluaran', 'Rp ' + beli.toLocaleString('id-ID'));
    setVal('kpi-lap-laba', 'Rp ' + Math.round(total - beli).toLocaleString('id-ID'));
    
    console.log('renderLaporan: ' + n + ' trx, total Rp ' + total.toLocaleString('id-ID'));
    return true;
  }

  window.renderLaporan = renderLaporan;

  // Keep trying until both button bound AND tab observer set
  var timer = setInterval(function() {
    attempts++;
    var done = true;
    
    // 1. Bind "Tampilkan" button
    var btns = document.querySelectorAll('button');
    var bound = false;
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].textContent.indexOf('Tampilkan') >= 0 && !btns[i].dataset.bnd) {
        btns[i].addEventListener('click', function() { renderLaporan(); });
        btns[i].dataset.bnd = '1';
        console.log('✅ Tombol "Tampilkan" terikat');
        bound = true;
      }
    }
    
    // 2. Set up MutationObserver on tab-laporan
    if (!window.__laporanObserverSet) {
      var tab = document.getElementById('tab-laporan');
      if (tab) {
        new MutationObserver(function(ms) {
          ms.forEach(function(m) {
            if (!m.target.classList.contains('hidden')) {
              setTimeout(function() { renderLaporan(); }, 300);
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
    if (attempts > 30) { clearInterval(timer); console.warn('Laporan fix: timeout setelah ' + (attempts*INTERVAL/1000) + 's'); }
  }, INTERVAL);
  
  console.log('📊 final-laporan-fix.js LOADED');
})();
