#!/bin/bash

# Bank Statement Parser - Backend Startup Script

cd "$(dirname "$0")/backend"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/.installed" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
    touch venv/.installed
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found!"
    echo "Please copy .env.example to .env and add your GROQ_API_KEY"
    exit 1
fi

# Check for GROQ_API_KEY
if ! grep -q "GROQ_API_KEY=gsk_" .env; then
    echo "WARNING: GROQ_API_KEY may not be set correctly in .env"
    echo "Please make sure to add your actual GroqCloud API key"
fi

echo ""
echo "Starting Flask backend on http://localhost:5000"
echo "Press Ctrl+C to stop"
echo ""

python run.py
