#!/bin/bash
# Activate Gmail CLI virtual environment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
VENV_DIR="$PROJECT_ROOT/.venv-gmail-cli"

if [ -f "$VENV_DIR/bin/activate" ]; then
    source "$VENV_DIR/bin/activate"
    echo "✓ Gmail CLI virtual environment activated"
    echo "Deactivate with: deactivate"
else
    echo "❌ Virtual environment not found. Run install.sh first."
    exit 1
fi
