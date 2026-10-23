@echo off
cd /d "%~dp0"
echo Starting THE ESCAPE PATH at http://localhost:8000
start "Escape Path Server" /min cmd /c "py -m http.server 8000"
timeout /t 2 /nobreak >nul
start "" chrome http://localhost:8000
if errorlevel 1 start "" http://localhost:8000
echo Keep the server window open while playing. Close it to stop the server.
pause
