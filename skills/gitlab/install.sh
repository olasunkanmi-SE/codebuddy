#!/bin/bash
set -e

# GitLab CLI (glab) Installation Script
# Installs glab from official sources (Homebrew or GitLab Releases)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
BIN_DIR="$PROJECT_ROOT/.codebuddy/bin"
TEMP_DIR=$(mktemp -d)

mkdir -p "$BIN_DIR"

echo "🔍 Checking for glab..."

# Method 1: Homebrew (Preferred for macOS)
if command -v brew >/dev/null 2>&1; then
    echo "🍺 Homebrew detected. Installing/Updating glab..."
    brew install glab || brew upgrade glab
    
    BREW_PREFIX=$(brew --prefix)
    
    # Symlink to bin
    echo "🔗 Linking to $BIN_DIR/glab..."
    ln -sf "$BREW_PREFIX/bin/glab" "$BIN_DIR/glab"
    
    echo "✅ glab installed via Homebrew!"
    "$BIN_DIR/glab" --version
    exit 0
fi

# Method 2: Manual Download (Fallback)
echo "⬇️  Downloading glab from official releases..."
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Map architecture names
if [ "$ARCH" == "x86_64" ]; then
    ARCH="x86_64"
elif [ "$ARCH" == "arm64" ]; then
    ARCH="arm64"
fi

# Latest release logic could be complex without jq/gh. 
# Using a fixed recent version for reliability if brew is missing.
GLAB_VERSION="1.36.0" 
FILENAME="glab_${GLAB_VERSION}_${OS}_${ARCH}.tar.gz"
DOWNLOAD_URL="https://gitlab.com/gitlab-org/cli/-/releases/v${GLAB_VERSION}/downloads/${FILENAME}"

cd "$TEMP_DIR"
echo "Downloading $DOWNLOAD_URL..."
curl -L -o glab.tar.gz "$DOWNLOAD_URL"

echo "📦 Extracting..."
tar xzf glab.tar.gz

echo "📂 Installing to $BIN_DIR..."
# The tarball structure usually has bin/glab
if [ -f "bin/glab" ]; then
    cp bin/glab "$BIN_DIR/"
else
    # Sometimes it's in root
    cp glab "$BIN_DIR/"
fi

chmod +x "$BIN_DIR/glab"

echo "✅ glab installed manually!"
"$BIN_DIR/glab" --version

# Cleanup
rm -rf "$TEMP_DIR"
