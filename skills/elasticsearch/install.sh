#!/bin/bash
set -e

# Elasticsearch Helpers Installation Script
# Installs 'jq' for JSON processing and creates an 'es-cli' wrapper.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
BIN_DIR="$PROJECT_ROOT/.codebuddy/bin"
TEMP_DIR=$(mktemp -d)
mkdir -p "$BIN_DIR"

# 1. Install jq (Essential for reading ES output)
echo "🔍 Checking for jq..."
if [ ! -f "$BIN_DIR/jq" ]; then
    echo "⬇️  Downloading jq..."
    ARCH=$(uname -m)
    if [ "$ARCH" == "arm64" ]; then
        JQ_URL="https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-macos-arm64"
    else
        JQ_URL="https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-macos-amd64"
    fi
    
    curl -L -o "$BIN_DIR/jq" "$JQ_URL"
    chmod +x "$BIN_DIR/jq"
    echo "✅ jq installed to $BIN_DIR/jq"
else
    echo "✅ jq already installed."
fi

# 2. Create es-cli wrapper
echo "🔗 Creating es-cli wrapper..."
ES_CLI_PATH="$BIN_DIR/es-cli"

cat > "$ES_CLI_PATH" <<EOF
#!/bin/bash
# Simple wrapper for Elasticsearch curl requests with pretty printing
# Usage: es-cli [method] [path] [data]

BASE_URL="\${ES_URL:-http://localhost:9200}"
BIN_DIR="\$(dirname "\$0")"
JQ="\$BIN_DIR/jq"

# Default to GET if first arg is a path (starts with /)
METHOD="GET"
PATH_ARG=""
DATA=""

if [[ "\$1" =~ ^[A-Z]+$ ]]; then
    METHOD="\$1"
    PATH_ARG="\$2"
    DATA="\$3"
else
    PATH_ARG="\$1"
    DATA="\$2"
fi

# Strip leading slash for cleanliness with base url
# (Though curl usually handles double slash fine)

FULL_URL="\${BASE_URL}\${PATH_ARG}"

echo "📡 \$METHOD \$FULL_URL" >&2

if [ -n "\$DATA" ]; then
    curl -s -X "\$METHOD" -H "Content-Type: application/json" -d "\$DATA" "\$FULL_URL" | "\$JQ" '.'
else
    curl -s -X "\$METHOD" -H "Content-Type: application/json" "\$FULL_URL" | "\$JQ" '.'
fi
EOF

chmod +x "$ES_CLI_PATH"
echo "✅ es-cli wrapper created at $BIN_DIR/es-cli"

# Cleanup
rm -rf "$TEMP_DIR"
