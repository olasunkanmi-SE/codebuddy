#!/bin/bash
# Generate Package Hashes for Requirements
# This script downloads packages and generates SHA256 hashes for pip's --require-hashes option
# Usage: ./generate-hashes.sh [output-file]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="${1:-$SCRIPT_DIR/requirements-locked.txt}"
TEMP_DIR=$(mktemp -d)

# Cleanup temp directory on exit
trap 'rm -rf "$TEMP_DIR"' EXIT

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔐 Generating Package Hashes"
echo "============================"
echo ""

# Core packages to hash (pinned versions for reproducibility)
PACKAGES=(
    "google-api-python-client==2.108.0"
    "google-auth-httplib2==0.1.1"
    "google-auth-oauthlib==1.1.0"
    "google-auth==2.23.4"
    "cryptography==41.0.7"
)

# Header for output file
cat > "$OUTPUT_FILE" << 'EOF'
# Gmail CLI Python Dependencies - LOCKED with hashes
# Generated with generate-hashes.sh
# Install with: pip install --require-hashes -r requirements-locked.txt
#
# WARNING: These hashes are tied to specific package versions.
# Regenerate after updating package versions.

EOF

echo -e "${YELLOW}⚠️  Note: This requires network access to download packages${NC}"
echo ""

for package in "${PACKAGES[@]}"; do
    pkg_name=$(echo "$package" | cut -d'=' -f1)
    echo "📦 Processing: $package"
    
    # Download package
    pip download --no-deps --dest "$TEMP_DIR" "$package" 2>/dev/null
    
    # Find the downloaded file
    pkg_file=$(ls -1 "$TEMP_DIR"/*.whl 2>/dev/null | head -1 || ls -1 "$TEMP_DIR"/*.tar.gz 2>/dev/null | head -1)
    
    if [ -z "$pkg_file" ]; then
        echo "  ❌ Failed to download $package"
        continue
    fi
    
    # Generate hash
    hash=$(pip hash "$pkg_file" 2>/dev/null | grep "sha256:" | head -1)
    
    if [ -n "$hash" ]; then
        echo "$package \\" >> "$OUTPUT_FILE"
        echo "    $hash" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo -e "  ${GREEN}✓${NC} Hash generated"
    else
        echo "  ❌ Failed to generate hash"
    fi
    
    # Clean up for next package
    rm -f "$TEMP_DIR"/*
done

echo ""
echo -e "${GREEN}✓${NC} Hashes written to: $OUTPUT_FILE"
echo ""
echo "To use hash verification:"
echo "  pip install --require-hashes -r $OUTPUT_FILE"
