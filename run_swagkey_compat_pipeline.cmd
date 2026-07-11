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
set "COMPAT_TARGETS=%DATA_DIR%\swagkey_compat_targets.json"
set "COMPAT_SPECS=%DATA_DIR%\swagkey_compat_specs.json"
set "COMPAT_FAILURES=%DATA_DIR%\swagkey_compat_specs.failures.csv"

if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%CACHE_DIR%" mkdir "%CACHE_DIR%"

echo [1/4] Generate plate/foam targets...
"%PYTHON_EXE%" backend\scripts\generate_swagkey_compat_targets.py --seed "%SEED_PATH%" --out "%COMPAT_TARGETS%"
if errorlevel 1 goto :fail

echo [2/4] Extract compatibility specs from source URLs...
"%PYTHON_EXE%" backend\scripts\extract_swagkey_compat_specs.py --targets "%COMPAT_TARGETS%" --out "%COMPAT_SPECS%" --cache-dir "%CACHE_DIR%" --max-retries 3 --retry-backoff-ms 700
if errorlevel 1 goto :fail

echo [3/4] Retry failed IDs and merge retry rows...
"%PYTHON_EXE%" backend\scripts\retry_failed_swagkey_compat_specs.py --targets "%COMPAT_TARGETS%" --failures-csv "%COMPAT_FAILURES%" --existing-specs "%COMPAT_SPECS%" --out "%COMPAT_SPECS%" --cache-dir "%CACHE_DIR%"
if errorlevel 1 goto :fail

echo [4/4] Merge extracted compatibility metadata into seed...
"%PYTHON_EXE%" backend\scripts\enrich_component_specs.py --seed "%SEED_PATH%" --specs "%COMPAT_SPECS%"
if errorlevel 1 goto :fail

echo.
echo Done. Compatibility pipeline finished successfully.
echo - Specs: %COMPAT_SPECS%
echo - Seed:  %SEED_PATH%
exit /b 0

:fail
echo.
echo Pipeline failed with exit code %errorlevel%.
exit /b %errorlevel%

