@echo off
setlocal
set "FGTS=%~dp0..\FGTS_por_obra_poligonal"
set "PYTHONW=%FGTS%\.venv\Scripts\pythonw.exe"
if not exist "%PYTHONW%" (
    echo [ERRO] FGTS por Obra nao esta instalado. Execute primeiro:
    echo "%FGTS%\scripts\instalar.bat"
    pause
    exit /b 1
)
set "PYTHONPATH=%FGTS%\src"
start "" "%PYTHONW%" -m fgts_obra.reader_bridge --reader "%~dp0Leitor_FGTS.html"
endlocal
