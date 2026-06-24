@echo off
:: =============================================
::   APOTEK POS KIOSK LAUNCHER - FULLSCREEN
:: =============================================

:: Cari Chrome
set CHROME=
for %%f in (
  "C:\Program Files\Google\Chrome\Application\chrome.exe"
  "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
  "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
) do ( if exist %%f set CHROME=%%f )

if "%CHROME%"=="" (
  echo Chrome tidak ditemukan. Install dari google.com/chrome
  pause
  exit /b
)

:: Fullscreen kiosk: no UI, no print dialog
start "" "%CHROME%" --kiosk --kiosk-printing "https://apotek-pos.vercel.app/login.html"
