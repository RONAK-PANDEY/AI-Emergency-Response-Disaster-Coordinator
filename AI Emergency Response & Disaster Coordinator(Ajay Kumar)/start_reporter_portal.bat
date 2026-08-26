@echo off
title Launch Citizen Emergency Reporter Portal
setlocal EnableDelayedExpansion

set "ROOT_DIR=%~dp0"
call "%ROOT_DIR%reporter-portal\start_all.bat"
