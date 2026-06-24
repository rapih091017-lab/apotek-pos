// Global: renderLaporan + auto-bind Tampilkan button
window.renderLaporan = function() {
  var d1 = document.querySelector('#sub-laporan-penjualan input[type="date"]:first-child');
  var d2 = document.querySelector('#sub-laporan-penjualan input[type="date"]:nth-child(3)');
  var tgl1 = d1 && d1.value ? new Date(d1.value) : new Date(); 
  if (!d1 || !d1.value) tgl1.setDate(tgl1.getDate()-30);
  var tgl2 = d2 && d2.value ? new Date(d2.value) : new Date();
  
  var txns = []; try { txns = JSON.parse(localStorage.getItem('apotek_pos_transactions')||'[]'); } catch(e) {}
  var filtered = txns.filter(function(t) {
    var d = new Date(t.created_at||t.tanggal); return !isNaN(d) && d >= tgl1 && d <= tgl2;
  });
  
  var total = filtered.reduce(function(s,t) { return s + (parseInt(t.total)||0); }, 0);
  var count = filtered.length;
  var hariCount = Math.max(1, Math.ceil((tgl2-tgl1)/86400000));
  var pembelian = 0;
  try {
    var invs = JSON.parse(localStorage.getItem('apotek_purchase_invoices')||'[]');
    pembelian = invs.filter(function(i) {
      var d = new Date(i.tanggal||i.tanggal_faktur); return d >= tgl1 && d <= tgl2;
    }).reduce(function(s,i) { return s+(i.total||0); }, 0);
  } catch(e) {}
  
  function set(id, val) { var e = document.getElementById(id); if (e) e.textContent = val; }
  set('kpi-lap-penjualan', 'Rp '+total.toLocaleString('id-ID'));
  set('kpi-lap-transaksi', count.toString());
  set('kpi-lap-ratahari', 'Rp '+Math.round(total/hariCount).toLocaleString('id-ID'));
  set('kpi-lap-ratatrx', count ? 'Rp '+Math.round(total/count).toLocaleString('id-ID') : 'Rp 0');
  set('kpi-lap-margin', 'Rp '+Math.round(total*0.25).toLocaleString('id-ID'));
  set('kpi-lap-pemasukan', 'Rp '+total.toLocaleString('id-ID'));
  set('kpi-lap-pengeluaran', 'Rp '+pembelian.toLocaleString('id-ID'));
  set('kpi-lap-laba', 'Rp '+Math.round(total-pembelian).toLocaleString('id-ID'));
  
  console.log('📊 Laporan: '+count+' transaksi, Rp '+total.toLocaleString('id-ID'));
  return { total: total, count: count, hari: hariCount };
};

// Auto-bind: cari semua button "🔍 Tampilkan" dan tambahin onclick
document.addEventListener('DOMContentLoaded', function() {
  var buttons = document.querySelectorAll('button');
  buttons.forEach(function(btn) {
    if (btn.textContent.includes('🔍') || btn.textContent.includes('Tampilkan')) {
      btn.onclick = function() { window.renderLaporan(); };
    }
  });
});
