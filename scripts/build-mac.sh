#!/bin/bash

echo "🚀 Building GravityQA for macOS..."
echo "=================================="
echo ""

# Build frontend
echo "📦 Building React frontend..."
npm run build:frontend
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

# Build Electron
echo "⚡ Building Electron app..."
npx electron-builder --mac
if [ $? -ne 0 ]; then
    echo "❌ Electron build failed"
    exit 1
fi

echo ""
echo "=================================="
echo "✅ Build complete!"
echo ""
echo "Your macOS app is ready:"
echo "📁 release/mac/GravityQA.app"
echo ""
echo "To create DMG installer:"
echo "npm run package"
