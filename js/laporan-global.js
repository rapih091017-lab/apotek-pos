// LAPORAN GLOBAL — delegates to comprehensive implementation in final-laporan-fix.js
(function() {
  'use strict';
  
  // Delegate: if comprehensive renderLaporan already exists, use it; otherwise fall back
  if (!window.renderLaporan || window.renderLaporan.name !== 'renderLaporan') {
    window.renderLaporan = function renderLaporan() {
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
      
      console.log('📊 renderLaporan (fallback): ' + count + ' trx, total Rp ' + total.toLocaleString('id-ID'));
      return { total: total, count: count, hari: hariCount };
    };
  }
  
  console.log('📊 laporan-global.js LOADED — fallback ready');
})();
