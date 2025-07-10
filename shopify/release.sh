#!/bin/bash

# Complete release script for Shopify widget
# Usage: ./release.sh [major|minor|patch]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}🚀 Shopify Widget Release Process${NC}"
echo ""

# 1. Bump version
BUMP_TYPE=${1:-patch}
echo -e "${YELLOW}Step 1: Bumping version ($BUMP_TYPE)...${NC}"
./bump-version.sh "$BUMP_TYPE"

# Get new version
NEW_VERSION=$(grep -o '"version": "[^"]*"' "$SCRIPT_DIR/version.json" | cut -d'"' -f4)

# 2. Build
echo ""
echo -e "${YELLOW}Step 2: Building widget...${NC}"
./deploy-local.sh build

# 3. Deploy to GCP
echo ""
echo -e "${YELLOW}Step 3: Deploying to GCP...${NC}"
read -p "Deploy to GCP? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./deploy-gcp.sh deploy
    
    # 4. Invalidate cache
    echo ""
    echo -e "${YELLOW}Step 4: Invalidating CDN cache...${NC}"
    ./deploy-gcp.sh invalidate
else
    echo -e "${YELLOW}Skipping GCP deployment${NC}"
fi

# 5. Git operations
echo ""
echo -e "${YELLOW}Step 5: Git operations...${NC}"
echo "Changes to be committed:"
git status --short

read -p "Commit and tag these changes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add -A
    git commit -m "chore: release Shopify widget v$NEW_VERSION"
    git tag "shopify-v$NEW_VERSION"
    echo -e "${GREEN}✅ Created git tag: shopify-v$NEW_VERSION${NC}"
    
    read -p "Push to remote? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push origin HEAD
        git push origin "shopify-v$NEW_VERSION"
        echo -e "${GREEN}✅ Pushed to remote${NC}"
    fi
else
    echo -e "${YELLOW}Skipping git operations${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Release process complete!${NC}"
echo -e "${BLUE}Version $NEW_VERSION is ready${NC}"
echo ""
echo "CDN URLs:"
echo "  Widget: https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/v1/widget.js"
echo "  Core: https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/core/chat-widget.js"
echo "  Config Tool: https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/shopify/config-tool/index.html"