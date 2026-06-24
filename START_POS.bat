@echo off
title Apotek POS Server
echo ==============================================
echo MENYALAKAN SERVER APOTEK POS DAN WHATSAPP BOT
echo ==============================================
echo.

:: Menjalankan server Node.js di background window
start "Apotek POS Backend" cmd /k "node server.js"

:: Menunggu 4 detik agar server siap
timeout /t 4 /nobreak >nul

echo Membuka Aplikasi Kasir...
echo Mode: Kiosk (Cetak Struk Otomatis Tanpa Nanya)
:: Membuka Chrome ke localhost:8000 dengan flag silent print
start chrome --kiosk-printing "http://localhost:8000/unified_home.html"

exit
