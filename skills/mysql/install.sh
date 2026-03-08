#!/bin/bash
set -e

# MySQL Installation Script
# Installs MySQL client from Official MySQL Downloads

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
BIN_DIR="$PROJECT_ROOT/.codebuddy/bin"
LIB_DIR="$PROJECT_ROOT/.codebuddy/lib/mysql"
TEMP_DIR=$(mktemp -d)

# Detect Architecture
ARCH=$(uname -m)
if [ "$ARCH" == "arm64" ]; then
    MYSQL_FILE="mysql-8.0.33-macos13-arm64.tar.gz"
else
    MYSQL_FILE="mysql-8.0.33-macos13-x86_64.tar.gz"
fi

# Fallback to brew if available
if command -v brew >/dev/null 2>&1; then
    echo "🍺 Homebrew detected. Preferring 'brew install mysql-client' for stability..."
    echo "   Running: brew install mysql-client"
    brew install mysql-client
    
    # Symlink to bin
    BREW_PREFIX=$(brew --prefix)
    mkdir -p "$BIN_DIR"
    ln -sf "$BREW_PREFIX/opt/mysql-client/bin/mysql" "$BIN_DIR/mysql"
    ln -sf "$BREW_PREFIX/opt/mysql-client/bin/mysqldump" "$BIN_DIR/mysqldump"
    
    echo "✅ MySQL binaries linked from Homebrew to $BIN_DIR"
    exit 0
fi

# Manual Install
BASE_URL="https://downloads.mysql.com/archives/get/p/23/file"
DOWNLOAD_URL="${BASE_URL}/${MYSQL_FILE}"

echo "⬇️  Downloading MySQL Client ($ARCH)..."
cd "$TEMP_DIR"
curl -L -o mysql.tar.gz "$DOWNLOAD_URL"

echo "📦 Extracting..."
tar xzf mysql.tar.gz
EXTRACTED_DIR=$(tar tf mysql.tar.gz | head -1 | cut -f1 -d"/")

echo "📂 Installing to $LIB_DIR..."
mkdir -p "$LIB_DIR"
cp -r "${EXTRACTED_DIR}/"* "$LIB_DIR/"

echo "🔗 Creating wrappers in $BIN_DIR..."
mkdir -p "$BIN_DIR"

cat > "$BIN_DIR/mysql" <<EOF
#!/bin/bash
export DYLD_LIBRARY_PATH="$LIB_DIR/lib:\$DYLD_LIBRARY_PATH"
exec "$LIB_DIR/bin/mysql" "\$@"
EOF
chmod +x "$BIN_DIR/mysql"

cat > "$BIN_DIR/mysqldump" <<EOF
#!/bin/bash
export DYLD_LIBRARY_PATH="$LIB_DIR/lib:\$DYLD_LIBRARY_PATH"
exec "$LIB_DIR/bin/mysqldump" "\$@"
EOF
chmod +x "$BIN_DIR/mysqldump"

echo "✅ mysql installed successfully!"
"$BIN_DIR/mysql" --version

# Cleanup
rm -rf "$TEMP_DIR"
