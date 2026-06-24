// Marketing-Kontak bridge: follow-up form baca dari apotek_kontak
(function() {
  var origOpenFollowupForm = window.openFollowupForm || function() {};
  
  // Override openFollowupForm dengan kontak dropdown
  window.openFollowupForm = function(id) {
    // Panggil original dulu
    origOpenFollowupForm(id);
    
    // Delay sebentar biar DOM siap
    setTimeout(function() {
      var pelangganEl = document.getElementById('fu-pelanggan');
      var nowaEl = document.getElementById('fu-nowa');
      if (!pelangganEl) return;
      
      // Ganti text input jadi select kalau bukan edit mode
      if (!id && pelangganEl.tagName === 'INPUT') {
        var parent = pelangganEl.parentElement;
        var select = document.createElement('select');
        select.id = 'fu-pelanggan';
        select.className = 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm';
        
        var kontak = [];
        try { kontak = JSON.parse(localStorage.getItem('apotek_kontak') || '[]'); } catch(e) {}
        
        var html = '<option value="">-- Pilih dari kontak --</option>';
        kontak.forEach(function(k) {
          if (k.nama && k.no_hp) {
            html += '<option value="' + k.nama + '" data-nohp="' + k.no_hp + '">' + k.nama + ' (' + k.no_hp + ')</option>';
          }
        });
        html += '<option value="__manual__">✏️ Input manual...</option>';
        select.innerHTML = html;
        
        select.onchange = function() {
          var opt = select.options[select.selectedIndex];
          if (opt.value === '__manual__') {
            // Ganti balik ke input text
            var input = document.createElement('input');
            input.type = 'text';
            input.id = 'fu-pelanggan';
            input.placeholder = 'Nama pelanggan';
            input.className = 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm';
            select.replaceWith(input);
            if (nowaEl) nowaEl.value = '';
            return;
          }
          if (opt.dataset.nohp && nowaEl) nowaEl.value = opt.dataset.nohp;
        };
        
        pelangganEl.replaceWith(select);
      }
    }, 200);
  };
  
  console.log('📢 Marketing-Kontak bridge: follow-up form reads apotek_kontak');
})();
