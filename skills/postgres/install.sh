#!/bin/bash
set -e

# PostgreSQL Installation Script
# Installs psql client from EnterpriseDB (Official Installer provider) binaries

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
BIN_DIR="$PROJECT_ROOT/.codebuddy/bin"
LIB_DIR="$PROJECT_ROOT/.codebuddy/lib/postgres"
TEMP_DIR=$(mktemp -d)

# EDB binaries version
# Note: Changing versions might break if URL schema changes
# Using a known stable URL for macOS (checking architecture)
ARCH=$(uname -m)
OS=$(uname -s)

if [ "$OS" != "Darwin" ]; then
    echo "❌ This script currently supports macOS only."
    exit 1
fi

# Fallback to brew if available?
if command -v brew >/dev/null 2>&1; then
    echo "🍺 Homebrew detected. Preferring 'brew install libpq' for stability..."
    echo "   Running: brew install libpq"
    brew install libpq
    
    # Symlink to bin
    BREW_PREFIX=$(brew --prefix)
    mkdir -p "$BIN_DIR"
    ln -sf "$BREW_PREFIX/opt/libpq/bin/psql" "$BIN_DIR/psql"
    ln -sf "$BREW_PREFIX/opt/libpq/bin/pg_dump" "$BIN_DIR/pg_dump"
    ln -sf "$BREW_PREFIX/opt/libpq/bin/pg_restore" "$BIN_DIR/pg_restore"
    
    echo "✅ Postgres binaries linked from Homebrew to $BIN_DIR"
    exit 0
fi

# Manual Install Process (Fallback)
echo "⬇️  Downloading PostgreSQL binaries from EnterpriseDB..."
# Warning: EDB links often expire or change. 
# Using a specific version 15.3 which is commonly available.
DOWNLOAD_URL="https://get.enterprisedb.com/postgresql/postgresql-15.3-1-osx-binaries.zip"

cd "$TEMP_DIR"
curl -L -o postgres.zip "$DOWNLOAD_URL"

echo "📦 Extracting..."
unzip -q postgres.zip

echo "📂 Installing to $LIB_DIR..."
mkdir -p "$LIB_DIR"
# Copy contents
cp -r pgsql/* "$LIB_DIR/"

echo "🔗 Creating wrappers in $BIN_DIR..."
mkdir -p "$BIN_DIR"

# Create a wrapper script to handle dynamic libraries if needed
cat > "$BIN_DIR/psql" <<EOF
#!/bin/bash
export DYLD_LIBRARY_PATH="$LIB_DIR/lib:\$DYLD_LIBRARY_PATH"
exec "$LIB_DIR/bin/psql" "\$@"
EOF
chmod +x "$BIN_DIR/psql"

echo "✅ psql installed successfully (Standalone)!"
"$BIN_DIR/psql" --version

# Cleanup
rm -rf "$TEMP_DIR"
