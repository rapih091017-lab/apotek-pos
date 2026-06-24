// LAPORAN GLOBAL — Brute-force binding tanpa modifikasi HTML
(function() {
  'use strict';
  
  // ===== RENDER FUNCTION =====
  function renderLaporan() {
    var penjualanDiv = document.getElementById('sub-laporan-penjualan');
    var d1 = penjualanDiv ? penjualanDiv.querySelector('input[type="date"]:first-of-type') : null;
    var d2 = penjualanDiv ? penjualanDiv.querySelectorAll('input[type="date"]')[1] : null;
    var tgl1 = (d1 && d1.value) ? new Date(d1.value) : new Date();
    if (!d1 || !d1.value) tgl1.setDate(tgl1.getDate() - 30);
    var tgl2 = (d2 && d2.value) ? new Date(d2.value) : new Date();
    
    var txns = [];
    try { txns = JSON.parse(localStorage.getItem('apotek_pos_transactions') || '[]'); } catch(e) {}
    
    var filtered = txns.filter(function(t) {
      var d = new Date(t.created_at || t.tanggal);
      return !isNaN(d.getTime()) && d >= tgl1 && d <= tgl2;
    });
    
    var total = filtered.reduce(function(s, t) { return s + (parseInt(t.total) || 0); }, 0);
    var count = filtered.length;
    var hariCount = Math.max(1, Math.ceil((tgl2 - tgl1) / 86400000));
    
    var pembelian = 0;
    try {
      var invs = JSON.parse(localStorage.getItem('apotek_purchase_invoices') || '[]');
      pembelian = invs.filter(function(i) {
        var d = new Date(i.tanggal || i.tanggal_faktur);
        return !isNaN(d.getTime()) && d >= tgl1 && d <= tgl2;
      }).reduce(function(s, i) { return s + (i.total || 0); }, 0);
    } catch(e) {}
    
    function setVal(id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val;
    }
    
    setVal('kpi-lap-penjualan', 'Rp ' + total.toLocaleString('id-ID'));
    setVal('kpi-lap-transaksi', count.toString());
    setVal('kpi-lap-ratahari', 'Rp ' + Math.round(total / hariCount).toLocaleString('id-ID'));
    setVal('kpi-lap-ratatrx', count ? 'Rp ' + Math.round(total / count).toLocaleString('id-ID') : 'Rp 0');
    setVal('kpi-lap-margin', 'Rp ' + Math.round(total * 0.25).toLocaleString('id-ID'));
    setVal('kpi-lap-pemasukan', 'Rp ' + total.toLocaleString('id-ID'));
    setVal('kpi-lap-pengeluaran', 'Rp ' + pembelian.toLocaleString('id-ID'));
    setVal('kpi-lap-laba', 'Rp ' + Math.round(total - pembelian).toLocaleString('id-ID'));
    
    console.log('📊 renderLaporan: ' + count + ' trx, total Rp ' + total.toLocaleString('id-ID'));
    return { total: total, count: count, hari: hariCount };
  }
  
  // ===== EXPORT GLOBAL =====
  window.renderLaporan = renderLaporan;
  
  // ===== BRUTE-FORCE BINDING: cari tombol "Tampilkan" setiap 500ms =====
  var bindAttempts = 0;
  var bindInterval = setInterval(function() {
    bindAttempts++;
    var allButtons = document.querySelectorAll('button');
    var bound = false;
    for (var i = 0; i < allButtons.length; i++) {
      var btn = allButtons[i];
      if (btn.textContent.includes('Tampilkan') && !btn.dataset.laporanBound) {
        btn.onclick = function(e) {
          e.preventDefault();
          renderLaporan();
          return false;
        };
        btn.dataset.laporanBound = '1';
        bound = true;
        console.log('✅ Tombol Tampilkan DIBINDING — klik untuk update laporan');
      }
    }
    if (bound || bindAttempts > 20) {
      clearInterval(bindInterval);
      if (bindAttempts > 20) console.warn('⚠️ Tombol Tampilkan tidak ditemukan setelah 10 detik');
    }
  }, 500);
  
  // ===== AUTO-RUN saat Laporan tab dibuka =====
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mut) {
      if (mut.target.id === 'tab-laporan' && !mut.target.classList.contains('hidden')) {
        setTimeout(function() { renderLaporan(); }, 300);
      }
    });
  });
  
  setTimeout(function() {
    var tabLaporan = document.getElementById('tab-laporan');
    if (tabLaporan) observer.observe(tabLaporan, { attributes: true, attributeFilter: ['class'] });
  }, 500);
  
  console.log('📊 laporan-global.js LOADED — renderLaporan() siap digunakan');
})();
