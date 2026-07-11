@echo off
setlocal ENABLEDELAYEDEXPANSION

REM Run from repository root (this script's directory).
cd /d "%~dp0"

REM Prefer project venv python, fallback to system python.
set "PYTHON_EXE=.venv\Scripts\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=python"

set "SEED_PATH=backend\src\keyboard_recommender\catalog\swagkey_products.seed.json"
set "DATA_DIR=backend\data"
set "CACHE_DIR=%DATA_DIR%\swagkey_html_cache"

set "SWITCH_TARGETS=%DATA_DIR%\swagkey_switch_targets.json"
set "SWITCH_SPECS=%DATA_DIR%\swagkey_switch_specs.json"
set "SWITCH_FAILURES=%DATA_DIR%\swagkey_switch_specs.failures.csv"

set "COMPAT_TARGETS=%DATA_DIR%\swagkey_compat_targets.json"
set "COMPAT_SPECS=%DATA_DIR%\swagkey_compat_specs.json"
set "COMPAT_FAILURES=%DATA_DIR%\swagkey_compat_specs.failures.csv"

if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%CACHE_DIR%" mkdir "%CACHE_DIR%"

echo [1/8] Generate switch targets...
"%PYTHON_EXE%" backend\scripts\generate_swagkey_spec_targets.py --seed "%SEED_PATH%" --out "%SWITCH_TARGETS%"
if errorlevel 1 goto :fail

echo [2/8] Extract switch specs...
"%PYTHON_EXE%" backend\scripts\extract_swagkey_specs.py --targets "%SWITCH_TARGETS%" --out "%SWITCH_SPECS%" --cache-dir "%CACHE_DIR%" --max-retries 3 --retry-backoff-ms 700
if errorlevel 1 goto :fail

echo [3/8] Retry failed switch IDs...
"%PYTHON_EXE%" backend\scripts\retry_failed_swagkey_specs.py --targets "%SWITCH_TARGETS%" --failures-csv "%SWITCH_FAILURES%" --existing-specs "%SWITCH_SPECS%" --out "%SWITCH_SPECS%" --cache-dir "%CACHE_DIR%"
if errorlevel 1 goto :fail

echo [4/8] Merge switch specs into seed...
"%PYTHON_EXE%" backend\scripts\enrich_switch_specs.py --seed "%SEED_PATH%" --specs "%SWITCH_SPECS%"
if errorlevel 1 goto :fail

echo [5/8] Generate plate/foam compatibility targets...
"%PYTHON_EXE%" backend\scripts\generate_swagkey_compat_targets.py --seed "%SEED_PATH%" --out "%COMPAT_TARGETS%"
if errorlevel 1 goto :fail

echo [6/8] Extract plate/foam compatibility specs...
"%PYTHON_EXE%" backend\scripts\extract_swagkey_compat_specs.py --targets "%COMPAT_TARGETS%" --out "%COMPAT_SPECS%" --cache-dir "%CACHE_DIR%" --max-retries 3 --retry-backoff-ms 700
if errorlevel 1 goto :fail

echo [7/8] Retry failed plate/foam IDs...
"%PYTHON_EXE%" backend\scripts\retry_failed_swagkey_compat_specs.py --targets "%COMPAT_TARGETS%" --failures-csv "%COMPAT_FAILURES%" --existing-specs "%COMPAT_SPECS%" --out "%COMPAT_SPECS%" --cache-dir "%CACHE_DIR%"
if errorlevel 1 goto :fail

echo [8/8] Merge compatibility specs into seed...
"%PYTHON_EXE%" backend\scripts\enrich_component_specs.py --seed "%SEED_PATH%" --specs "%COMPAT_SPECS%"
if errorlevel 1 goto :fail

echo.
echo Done. Full swagkey pipeline finished successfully.
echo - Switch specs: %SWITCH_SPECS%
echo - Compat specs: %COMPAT_SPECS%
echo - Seed:         %SEED_PATH%
exit /b 0

:fail
echo.
echo Pipeline failed with exit code %errorlevel%.
exit /b %errorlevel%

