#!/bin/bash
echo "🔨 Building React app..."
npm run build
echo "✅ Build complete"
echo "🚀 Starting frontend server..."
node server.js
