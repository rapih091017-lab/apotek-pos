// PEMBELIAN RECEIVE — Full Overhaul
// Bypass: openReceiveForm, confirmReceive, calcReceiveTotal, all monkey-patches
(function() {
  'use strict';
  
  // Override PO table render — ganti onclick Terima & Lihat
  var _origRenderPO = renderPOTable;
  renderPOTable = function() {
    _origRenderPO();
    // After render, rebind all Terima/Lihat buttons
    setTimeout(function() {
      document.querySelectorAll('#tab-po button, #tab-po [onclick*="openReceiveForm"], button').forEach(function(btn) {
        var txt = btn.textContent.trim();
        if (txt === 'Terima' && !btn.dataset.overhauled) {
          btn.dataset.overhauled = '1';
          btn.onclick = function(e) { e.stopPropagation(); openReceiveOverhaul(btn); };
        }
        if (txt === 'Lihat' && !btn.dataset.overhauledLihat) {
          btn.dataset.overhauledLihat = '1';
          btn.onclick = function(e) { e.stopPropagation(); openLihatOverhaul(btn); };
        }
      });
    }, 200);
  };

  // ===== TERIMA: buka form receive =====
  window.openReceiveOverhaul = function(btn) {
    // Find PO row
    var row = btn.closest('tr');
    if (!row) return;
    var cells = row.querySelectorAll('td');
    if (cells.length < 2) return;
    var poNo = (cells[0] || {}).textContent.trim();
    var supplier = (cells[1] || {}).textContent.trim();
    
    if (!poNo) { showPembToast('⚠️ PO tidak ditemukan'); return; }
    
    // Find PO data from localStorage
    var pos = [];
    try { pos = JSON.parse(localStorage.getItem('apotek_purchase_orders') || '[]'); } catch(e) {}
    var po = pos.find(function(p) { return p.nomor === poNo || p.nomor_po === poNo; });
    
    // Open slideover
    var overlay = document.getElementById('receive-overlay');
    var slide = document.getElementById('receive-slideover');
    if (overlay) overlay.classList.remove('hidden');
    if (slide) slide.classList.remove('hidden');
    
    // Update header
    var header = document.getElementById('receive-header-info');
    if (header) header.innerHTML = '<span class="font-mono font-semibold">' + poNo + '</span> · ' + supplier;
    
    // Render items
    var container = slide ? slide.querySelector('.space-y-4 > div:nth-child(2)') : null;
    if (!container) return;
    
    var items = (po && po.items) ? po.items : [];
    if (!items.length) {
      // Fallback: create single item from PO name
      items = [{ nama: supplier || 'Item', qty: 1, satuan: 'Pcs', harga: 0 }];
    }
    
    var html = '<h4 class="text-sm font-semibold mb-3">Item Diterima</h4>';
    items.forEach(function(item, idx) {
      html += '<div class="border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-3 bg-gray-50 dark:bg-gray-900/50 receive-item" data-nama="' + (item.nama || '') + '">' +
        '<div class="flex items-center gap-2 mb-3">' +
          '<input type="checkbox" checked class="rounded text-primary receive-item-check" onchange="calcTotalOverhaul()">' +
          '<span class="text-sm font-medium">' + (item.nama || 'Item ' + (idx+1)) + '</span>' +
          '<span class="text-xs text-gray-500 dark:text-gray-400">(Dipesan: ' + (item.qty || 0) + ' ' + (item.satuan || 'Pcs') + ')</span>' +
        '</div>' +
        '<div class="grid grid-cols-2 gap-3">' +
          '<div><label class="block text-[10px] font-medium mb-0.5">Qty Diterima</label>' +
            '<input type="number" value="' + (item.qty || 0) + '" class="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs font-mono receive-qty-input" onchange="calcTotalOverhaul()"></div>' +
          '<div><label class="block text-[10px] font-medium mb-0.5">Harga/' + (item.satuan || 'Pcs') + '</label>' +
            '<div class="relative"><span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>' +
            '<input type="number" value="' + (item.harga || 0) + '" class="w-full pl-7 pr-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs font-mono receive-price-input" onchange="calcTotalOverhaul()"></div></div>' +
        '</div></div>';
    });
    container.innerHTML = html;
    calcTotalOverhaul();
    
    // Bind confirm button
    setTimeout(function() {
      document.querySelectorAll('#receive-slideover button').forEach(function(b) {
        if (b.textContent.includes('Terima Barang') && !b.dataset.overhauledConfirm) {
          b.dataset.overhauledConfirm = '1';
          b.onclick = function(e) { e.preventDefault(); e.stopPropagation(); confirmReceiveOverhaul(poNo, supplier); };
        }
      });
    }, 100);
  };
  
  // ===== LIHAT: tampilkan detail PO =====
  window.openLihatOverhaul = function(btn) {
    var row = btn.closest('tr');
    if (!row) return;
    var cells = row.querySelectorAll('td');
    var poNo = (cells[0] || {}).textContent.trim();
    var pos = [];
    try { pos = JSON.parse(localStorage.getItem('apotek_purchase_orders') || '[]'); } catch(e) {}
    var po = pos.find(function(p) { return p.nomor === poNo || p.nomor_po === poNo; });
    if (!po) { showPembToast('⚠️ PO ' + poNo + ' tidak ditemukan di database'); return; }
    
    var items = (po.items || []).map(function(i) { return '- ' + (i.nama || 'Item') + ' x' + (i.qty||0) + ' @Rp' + (i.harga||0).toLocaleString('id'); }).join('\n');
    alert('📋 ' + poNo + '\nSupplier: ' + (po.supplier||'') + '\nTanggal: ' + (po.tanggal||'') + '\nStatus: ' + (po.status||'') + '\n\nItem:\n' + (items || 'Tidak ada item'));
  };
  
  // ===== CALC TOTAL =====
  window.calcTotalOverhaul = function() {
    var total = 0, summary = [];
    document.querySelectorAll('#receive-slideover .receive-item').forEach(function(el) {
      var cb = el.querySelector('.receive-item-check');
      if (!cb || !cb.checked) return;
      var qty = parseInt((el.querySelector('.receive-qty-input')||{}).value) || 0;
      var price = parseInt((el.querySelector('.receive-price-input')||{}).value) || 0;
      total += qty * price;
      if (qty > 0) summary.push(qty + ' ' + (el.dataset.nama || ''));
    });
    var card = document.querySelector('#receive-slideover [class*="bg-orange"]');
    if (card) {
      var te = card.querySelector('.text-xl, .font-bold');
      if (te) te.textContent = 'Rp ' + total.toLocaleString('id');
      var se = card.querySelector('.text-xs');
      if (se) se.textContent = summary.join(' + ') || '';
    }
  };
  
  // ===== CONFIRM =====
  window.confirmReceiveOverhaul = function(poNo, supplier) {
    var noFaktur = (document.getElementById('receive-invoice-no') || {}).value || '';
    if (!noFaktur) { showPembToast('⚠️ Isi nomor faktur dulu'); return; }
    
    var items = [];
    document.querySelectorAll('#receive-slideover .receive-item').forEach(function(el) {
      var cb = el.querySelector('.receive-item-check');
      if (!cb || !cb.checked) return;
      var qty = parseInt((el.querySelector('.receive-qty-input')||{}).value) || 0;
      var price = parseInt((el.querySelector('.receive-price-input')||{}).value) || 0;
      var nama = el.dataset.nama || '';
      items.push({ nama: nama, qty: qty, harga: price, subtotal: qty * price });
    });
    if (!items.length) { showPembToast('⚠️ Centang minimal 1 item'); return; }
    
    // Update stock
    var products = [];
    try { products = JSON.parse(localStorage.getItem('apotek_products_master') || '[]'); } catch(e) {}
    items.forEach(function(item) {
      var found = products.find(function(p) {
        return (p.nama_dagang || p.nama || '').toLowerCase() === (item.nama || '').toLowerCase();
      });
      if (found) { found.stok = (found.stok || 0) + item.qty; found.stok_total = found.stok; found.stock = found.stok; }
    });
    localStorage.setItem('apotek_products_master', JSON.stringify(products));
    localStorage.setItem('products_master', JSON.stringify(products));
    
    // Save invoice
    var total = items.reduce(function(s, i) { return s + i.subtotal; }, 0);
    var faktur = {
      id: 'faktur_' + Date.now(), nomor: noFaktur, supplier: supplier,
      tanggal: new Date().toISOString().split('T')[0],
      tanggal_jatuh_tempo: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
      items: items, total: total, dibayar: 0, status: 'DITERIMA', po_ref: poNo
    };
    var invoices = [];
    try { invoices = JSON.parse(localStorage.getItem('apotek_purchase_invoices') || '[]'); } catch(e) {}
    invoices.unshift(faktur);
    localStorage.setItem('apotek_purchase_invoices', JSON.stringify(invoices));
    
    // Update PO
    try {
      var pos = JSON.parse(localStorage.getItem('apotek_purchase_orders') || '[]');
      var idx = pos.findIndex(function(p) { return p.nomor === poNo; });
      if (idx >= 0) { pos[idx].status = 'LUNAS'; pos[idx].diterima = (pos[idx].diterima||0) + items.length; }
      localStorage.setItem('apotek_purchase_orders', JSON.stringify(pos));
    } catch(e) {}
    
    document.getElementById('receive-overlay').classList.add('hidden');
    document.getElementById('receive-slideover').classList.add('hidden');
    showPembToast('✅ Barang diterima — stok +' + items.reduce(function(s,i){return s+i.qty;},0) + ' item, faktur ' + noFaktur);
    if (typeof renderPOTable === 'function') renderPOTable();
    if (typeof renderFakturTable === 'function') renderFakturTable();
    if (typeof renderHutangTable === 'function') renderHutangTable();
  };
  
  // Run immediately to rebind any existing buttons
  setTimeout(renderPOTable, 500);
  console.log('✅ Pembelian overhaul: Terima + Lihat + Total + Confirm ready');
})();
