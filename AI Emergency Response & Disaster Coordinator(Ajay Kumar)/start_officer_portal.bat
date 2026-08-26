@echo off
title Launch Government Officer Command Portal
setlocal EnableDelayedExpansion

set "ROOT_DIR=%~dp0"
call "%ROOT_DIR%officer-portal\start_all.bat"
