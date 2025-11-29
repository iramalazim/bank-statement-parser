#!/bin/bash

# Bank Statement Parser - Frontend Startup Script

cd "$(dirname "$0")/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

echo ""
echo "Starting Vite development server on http://localhost:5173"
echo "Press Ctrl+C to stop"
echo ""

npm run dev
