@echo off
REM Setup script for 5Cine Backend (Windows)

echo.
echo 🎬 5Cine Backend Setup
echo ====================
echo.

REM Check if .env exists
if not exist .env (
    echo 📋 Creating .env file from .env.example...
    copy .env.example .env
    echo ✅ .env created. Please update it with your credentials.
) else (
    echo ✅ .env file already exists.
)

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
    echo ✅ Dependencies installed.
) else (
    echo ✅ Dependencies already installed.
)

echo.
echo 🚀 Setup complete!
echo.
echo Next steps:
echo 1. Update .env with your MongoDB URI and other credentials
echo 2. Run: npm run dev  (development mode with auto reload)
echo 3. Or run: npm start (production mode)
echo.
echo 📚 For deployment guide, see DEPLOYMENT.md
echo.
pause
