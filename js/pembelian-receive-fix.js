// FIX: Pembelian receive — hook after slideover opens
(function() {
  var _origOpenReceive = openReceiveForm;
  openReceiveForm = function(poRef) {
    _origOpenReceive(poRef);
    // Tunggu DOM render, lalu bind button
    setTimeout(function() {
      var btns = document.querySelectorAll('#receive-slideover button');
      btns.forEach(function(btn) {
        if (btn.textContent.includes('Terima Barang') && !btn.dataset.fixedReceive) {
          btn.dataset.fixedReceive = '1';
          btn.onclick = function(e) {
            e.preventDefault(); e.stopPropagation();
            
            var noFaktur = (document.getElementById('receive-invoice-no') || {}).value || '';
            if (!noFaktur) { showPembToast('⚠️ Isi nomor faktur dulu'); return; }
            
            var items = [];
            var itemDivs = document.querySelectorAll('#receive-slideover .receive-item');
            itemDivs.forEach(function(el) {
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
              if (found) {
                found.stok = (found.stok || 0) + item.qty;
                found.stok_total = found.stok;
                found.stock = found.stok;
              }
            });
            localStorage.setItem('apotek_products_master', JSON.stringify(products));
            localStorage.setItem('products_master', JSON.stringify(products));
            
            // Save invoice
            var total = items.reduce(function(s, i) { return s + i.subtotal; }, 0);
            var faktur = {
              id: 'faktur_' + Date.now(), nomor: noFaktur,
              supplier: (window.__currentPOData || {}).supplier || 'Umum',
              tanggal: new Date().toISOString().split('T')[0],
              tanggal_jatuh_tempo: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
              items: items, total: total, dibayar: 0, status: 'DITERIMA'
            };
            var invoices = [];
            try { invoices = JSON.parse(localStorage.getItem('apotek_purchase_invoices') || '[]'); } catch(e) {}
            invoices.unshift(faktur);
            localStorage.setItem('apotek_purchase_invoices', JSON.stringify(invoices));
            
            // Update PO
            if (window.__currentPOData) {
              try {
                var pos = JSON.parse(localStorage.getItem('apotek_purchase_orders') || '[]');
                var idx = pos.findIndex(function(p) { return p.nomor === window.__currentPOData.nomor; });
                if (idx >= 0) {
                  pos[idx].status = items.length >= (pos[idx].items||[]).length ? 'LUNAS' : 'SEBAGIAN';
                  pos[idx].diterima = (pos[idx].diterima || 0) + items.length;
                  localStorage.setItem('apotek_purchase_orders', JSON.stringify(pos));
                }
              } catch(e) {}
            }
            
            closeReceiveForm();
            showPembToast('✅ Barang diterima — stok +' + items.reduce(function(s,i){return s+i.qty;},0) + ' item, faktur ' + noFaktur);
            if (typeof renderPOTable === 'function') renderPOTable();
            if (typeof renderFakturTable === 'function') renderFakturTable();
            if (typeof renderHutangTable === 'function') renderHutangTable();
          };
        }
      });
    }, 300);
  };
  // Override calcReceiveTotal — fix broken CSS selector
  window.calcReceiveTotal = function() {
    var items = document.querySelectorAll('#receive-slideover .receive-item');
    var total = 0;
    var summary = [];
    items.forEach(function(el) {
      var cb = el.querySelector('.receive-item-check');
      if (cb && cb.checked) {
        var qty = parseInt((el.querySelector('.receive-qty-input')||{}).value) || 0;
        var price = parseInt((el.querySelector('.receive-price-input')||{}).value) || 0;
        var name = el.dataset.nama || '';
        total += qty * price;
        if (qty > 0) summary.push(qty + ' ' + name);
      }
    });
    // Update via simple DOM traversal
    var totalCard = document.querySelector('#receive-slideover [class*="bg-orange"]');
    if (totalCard) {
      var totalEl = totalCard.querySelector('.text-xl, .font-bold');
      if (totalEl) totalEl.textContent = 'Rp ' + total.toLocaleString('id');
      var summaryEl = totalCard.querySelector('.text-xs');
      if (summaryEl) summaryEl.textContent = summary.join(' + ') || '';
    }
  };
  
  console.log('✅ Pembelian: receive fix hooked to openReceiveForm');
})();
