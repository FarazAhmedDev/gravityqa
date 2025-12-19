#!/bin/bash

echo "🚀 GravityQA Development Environment Setup"
echo "=========================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi
echo "✅ Node.js $(node -v) found"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.11+ first."
    exit 1
fi
echo "✅ Python $(python3 --version) found"

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
npm install

# Setup Python virtual environment
echo ""
echo "🐍 Setting up Python virtual environment..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..

# Install Appium (optional, can be done globally)
echo ""
read -p "📱 Install Appium globally? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm install -g appium
    appium driver install uiautomator2
    appium driver install xcuitest
    echo "✅ Appium installed"
fi

# Install ADB (optional)
echo ""
read -p "🤖 Install Android SDK Platform Tools (ADB)? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v brew &> /dev/null; then
        brew install --cask android-platform-tools
        echo "✅ ADB installed"
    else
        echo "⚠️  Homebrew not found. Please install manually."
    fi
fi

# Install scrcpy (optional)
echo ""
read -p "📺 Install scrcpy (screen mirroring)? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v brew &> /dev/null; then
        brew install scrcpy
        echo "✅ scrcpy installed"
    else
        echo "⚠️  Homebrew not found. Please install manually."
    fi
fi

echo ""
echo "=========================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Create backend/.env file with your API keys"
echo "2. Run 'npm run dev' to start all services"
echo "3. Or run services separately:"
echo "   - Backend: cd backend && source venv/bin/activate && python main.py"
echo "   - Frontend: npm run dev:frontend"
echo "   - Appium: npm run dev:appium"
echo ""
echo "Happy testing! 🚀"
