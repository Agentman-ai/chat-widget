#!/bin/bash

# Version bump script for Shopify widget
# Usage: ./bump-version.sh [major|minor|patch]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Files to update
VERSION_FILE="$SCRIPT_DIR/version.json"
SCRIPT_SERVICE_FILE="$SCRIPT_DIR/script-service/index.js"
CONFIG_TOOL_FILE="$SCRIPT_DIR/config-tool/script.js"
DEPLOY_LOCAL_FILE="$SCRIPT_DIR/deploy-local.sh"

# Get current version
if [ -f "$VERSION_FILE" ]; then
    CURRENT_VERSION=$(grep -o '"version": "[^"]*"' "$VERSION_FILE" | cut -d'"' -f4)
else
    CURRENT_VERSION="1.0.0"
fi

echo -e "${BLUE}Current version: $CURRENT_VERSION${NC}"

# Parse version components
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Determine version bump type
BUMP_TYPE=${1:-patch}

case $BUMP_TYPE in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
    *)
        echo -e "${RED}Invalid version bump type. Use: major, minor, or patch${NC}"
        exit 1
        ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
echo -e "${GREEN}New version: $NEW_VERSION${NC}"

# Update version.json
echo -e "${YELLOW}Updating version.json...${NC}"
if [ -f "$VERSION_FILE" ]; then
    # Update existing file
    sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" "$VERSION_FILE"
    rm -f "$VERSION_FILE.bak"
else
    # Create new file
    cat > "$VERSION_FILE" << EOF
{
    "version": "$NEW_VERSION",
    "updated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
fi

# Update script-service/index.js
echo -e "${YELLOW}Updating script-service/index.js...${NC}"
if [ -f "$SCRIPT_SERVICE_FILE" ]; then
    # Update SCRIPT_VERSION constant
    sed -i.bak "s/const SCRIPT_VERSION = '[^']*'/const SCRIPT_VERSION = '$NEW_VERSION'/" "$SCRIPT_SERVICE_FILE"
    rm -f "$SCRIPT_SERVICE_FILE.bak"
fi

# Update config-tool/script.js
echo -e "${YELLOW}Updating config-tool/script.js...${NC}"
if [ -f "$CONFIG_TOOL_FILE" ]; then
    # Update version in ShopifyConfigTool
    sed -i.bak "s/version: SCRIPT_VERSION,/version: '$NEW_VERSION',/" "$CONFIG_TOOL_FILE"
    sed -i.bak "s/window.agentmanShopifyDebug = {/window.agentmanShopifyDebug = {\n            version: '$NEW_VERSION',/" "$CONFIG_TOOL_FILE"
    rm -f "$CONFIG_TOOL_FILE.bak"
fi

# Update deploy-local.sh version header
echo -e "${YELLOW}Updating deploy-local.sh header template...${NC}"
if [ -f "$DEPLOY_LOCAL_FILE" ]; then
    # Update the version in the build header
    sed -i.bak "s/Version: [0-9]\+\.[0-9]\+\.[0-9]\+/Version: $NEW_VERSION/" "$DEPLOY_LOCAL_FILE"
    rm -f "$DEPLOY_LOCAL_FILE.bak"
fi

# No need for version update function since we're generating the file fresh

echo -e "${GREEN}✅ Version bumped to $NEW_VERSION${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Review the changes: git diff"
echo "2. Build the widget: ./deploy-local.sh build"
echo "3. Deploy to CDN: ./deploy-gcp.sh deploy"
echo "4. Commit changes: git add -A && git commit -m 'chore: bump version to $NEW_VERSION'"