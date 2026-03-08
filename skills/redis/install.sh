#!/bin/bash
set -e

# Redis Installation Script
# Downloads source from official redis.io, builds redis-cli, and installs to .codebuddy/bin

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
BIN_DIR="$PROJECT_ROOT/.codebuddy/bin"
TEMP_DIR=$(mktemp -d)

REDIS_VERSION="stable"
DOWNLOAD_URL="http://download.redis.io/redis-${REDIS_VERSION}.tar.gz"

echo "Using temp directory: $TEMP_DIR"
cd "$TEMP_DIR"

echo "📥 Downloading Redis ($REDIS_VERSION)..."
curl -fsSL "$DOWNLOAD_URL" -o redis.tar.gz

echo "📦 Extracting..."
tar xzf redis.tar.gz
cd redis-*

echo "🔨 Building redis-cli (this may take a moment)..."
# Build only redis-cli to save time
make redis-cli

echo "📂 Installing to $BIN_DIR..."
mkdir -p "$BIN_DIR"
cp src/redis-cli "$BIN_DIR/"
chmod +x "$BIN_DIR/redis-cli"

# Cleanup
cd "$PROJECT_ROOT"
rm -rf "$TEMP_DIR"

echo "✅ Redis CLI installed successfully!"
"$BIN_DIR/redis-cli" --version
