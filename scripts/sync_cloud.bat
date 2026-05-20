@echo off
python "%~dp0sync_cloud.py"
if errorlevel 1 pause
