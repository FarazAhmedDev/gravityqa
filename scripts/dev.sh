#!/bin/bash

echo "🚀 Starting GravityQA Development Environment"
echo "============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo -e "${RED}❌ Backend virtual environment not found${NC}"
    echo "Run ./scripts/setup.sh first to install dependencies"
    exit 1
fi

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  backend/.env not found${NC}"
    echo "Creating template .env file..."
    cat > backend/.env << EOF
# AI Provider (choose one)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

DEFAULT_LLM_PROVIDER=openai
DEFAULT_MODEL=gpt-4-vision-preview

# Database
DATABASE_URL=sqlite:///./gravityqa.db

# Appium
APPIUM_HOST=localhost
APPIUM_PORT=4723

# Paths
DATA_DIR=~/Library/Application Support/GravityQA
EOF
    echo -e "${GREEN}✅ Created backend/.env - Please add your API keys${NC}"
fi

# Start backend
echo ""
echo -e "${GREEN}📦 Starting FastAPI backend...${NC}"
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo ""
echo -e "${GREEN}🎨 Starting React frontend...${NC}"
npm run dev:frontend &
FRONTEND_PID=$!

# Wait for frontend
sleep 3

# Open Electron (optional)
echo ""
read -p "🖥️  Open Electron app? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run dev:electron &
    ELECTRON_PID=$!
fi

echo ""
echo "============================================="
echo -e "${GREEN}✅ GravityQA is running!${NC}"
echo ""
echo "Services:"
echo "  • Backend API: http://localhost:8000"
echo "  • API Docs: http://localhost:8000/docs"
echo "  • Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"
echo "============================================="

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID $ELECTRON_PID 2>/dev/null; exit" INT
wait
