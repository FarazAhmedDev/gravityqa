#!/bin/bash

echo "🚀 Launching GravityQA Desktop App..."
echo ""

# Start backend
echo "📱 Starting backend..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 3

# Open in Electron (browser mode)
echo "🖥️  Opening desktop window..."
open http://localhost:5173

echo ""
echo "✅ GravityQA is running!"
echo ""
echo "Press Ctrl+C to stop"

# Wait for interrupt
trap "kill $BACKEND_PID; exit" INT
wait
