#!/bin/bash

echo "🚀 GravityQA - Complete Setup Script"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Python
echo -e "${BLUE}📦 Checking Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found! Please install Python 3.9+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python found: $(python3 --version)${NC}"
echo ""

# Check Node.js
echo -e "${BLUE}📦 Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found! Please install Node.js 16+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"
echo ""

# Check npm
echo -e "${BLUE}📦 Checking npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found! Please install npm${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm found: $(npm --version)${NC}"
echo ""

# Install Python dependencies
echo -e "${BLUE}🐍 Installing Python dependencies...${NC}"
pip3 install --user -r requirements.txt
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Python dependencies installed${NC}"
else
    echo -e "${RED}❌ Python dependencies installation failed${NC}"
    exit 1
fi
echo ""

# Install Node.js dependencies (Frontend)
echo -e "${BLUE}📦 Installing Frontend dependencies...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${RED}❌ Frontend installation failed${NC}"
    exit 1
fi
echo ""

# Install webdriverio globally for code execution
echo -e "${BLUE}🌐 Installing webdriverio for test execution...${NC}"
npm install -g webdriverio || npm install webdriverio
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ webdriverio installed${NC}"
else
    echo -e "${RED}⚠️  webdriverio install warning (will auto-install on first use)${NC}"
fi
echo ""

# Check ADB
echo -e "${BLUE}📱 Checking ADB...${NC}"
if ! command -v adb &> /dev/null; then
    echo -e "${RED}⚠️  ADB not found! Install Android SDK Platform Tools${NC}"
    echo "Download: https://developer.android.com/tools/releases/platform-tools"
else
    echo -e "${GREEN}✅ ADB found: $(adb --version | head -n 1)${NC}"
fi
echo ""

# Setup complete
echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Start the app: ${BLUE}npm start${NC}"
echo "2. Connect your device via USB"
echo "3. Enable USB debugging"
echo "4. Start testing!"
echo ""
echo "Enjoy GravityQA! 🚀"
