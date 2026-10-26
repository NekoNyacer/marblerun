@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo 請先安裝 Node.js，再重新開啟此檔案。
 pause
 exit /b 1
)
if not exist dist\index.html (
 echo 尚未建立網頁檔案，請先執行 npm install 與 npm run build。
 pause
 exit /b 1
)
node scripts\serve.mjs --open
pause
