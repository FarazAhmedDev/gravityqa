#!/bin/bash

echo "🚀 Starting GravityQA Desktop App..."

# Kill any existing processes
echo "📋 Cleaning up old processes..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Start Vite dev server in background
echo "🎨 Starting frontend..."
npm run dev:frontend &
VITE_PID=$!

# Wait for Vite to be ready
echo "⏳ Waiting for frontend..."
sleep 5

# Start Electron (which will start backend)
echo "⚡ Launching Electron app..."
NODE_ENV=development electron .

# Cleanup on exit
echo "🧹 Cleaning up..."
kill $VITE_PID 2>/dev/null || true
