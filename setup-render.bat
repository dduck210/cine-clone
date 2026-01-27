@echo off
REM ==========================================
REM 5CINE Backend - Render Deployment Setup
REM ==========================================

cls
echo.
echo ╔════════════════════════════════════════╗
echo ║  5CINE Backend - Render Deployment    ║
echo ║         Setup Script                   ║
echo ╚════════════════════════════════════════╝
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ npm found!
echo.

REM Step 1: Install dependencies
echo [1/4] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm install failed!
    pause
    exit /b 1
)
echo ✅ Dependencies installed!
echo.

REM Step 2: Check Node version
echo [2/4] Checking Node version...
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node version: %NODE_VERSION%
echo ✅ Version check complete!
echo.

REM Step 3: Generate JWT Secret
echo [3/4] Generating JWT_SECRET...
echo.
echo Copy this JWT_SECRET to your .env.render file:
echo.
call node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
echo.
pause
echo.

REM Step 4: Display next steps
echo [4/4] Setup Summary
echo.
echo ✅ Dependencies installed
echo ✅ Node version checked
echo ✅ JWT_SECRET generated
echo.
echo ══════════════════════════════════════════
echo Next Steps:
echo ══════════════════════════════════════════
echo.
echo 1. Setup MongoDB Atlas:
echo    - Create account at mongodb.com
echo    - Create M0 (free) cluster
echo    - Whitelist IP: 0.0.0.0/0
echo    - Get connection string
echo.
echo 2. Update .env.render with:
echo    - MONGO_URI (from MongoDB Atlas)
echo    - JWT_SECRET (generated above)
echo    - Other sensitive keys
echo.
echo 3. Push to GitHub:
echo    - git add .
echo    - git commit -m "Init backend"
echo    - git push origin main
echo.
echo 4. Deploy on Render:
echo    - Go to https://dashboard.render.com
echo    - Connect GitHub
echo    - Create Web Service
echo    - Add environment variables
echo    - Start deployment
echo.
echo 5. Test deployment:
echo    - Check logs on Render dashboard
echo    - Test: https://[service-name].render.com/api/health
echo.
echo 📖 See QUICK_DEPLOY.md for detailed steps
echo.
pause
