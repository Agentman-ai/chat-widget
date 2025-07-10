#!/bin/bash

# Local Build and Deployment Script for Shopify Widget
# This creates a deployable package without AWS

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/dist"

# Read version from version.json if it exists
if [ -f "$SCRIPT_DIR/version.json" ]; then
    VERSION=$(grep -o '"version": "[^"]*"' "$SCRIPT_DIR/version.json" | cut -d'"' -f4)
else
    VERSION="1.0.0"
fi

BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Building Shopify Widget for Deployment${NC}"
echo -e "${BLUE}Version: $VERSION${NC}"
echo -e "${BLUE}Build Date: $BUILD_DATE${NC}\n"

# Clean and create build directory
echo -e "${YELLOW}Creating build directory...${NC}"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/cdn/shopify/v1"
mkdir -p "$BUILD_DIR/cdn/shopify/config-tool"
mkdir -p "$BUILD_DIR/cdn/shopify/docs"

# Build widget script
echo -e "${YELLOW}Building widget script...${NC}"
cat > "$BUILD_DIR/cdn/shopify/v1/widget.js" << EOF
/**
 * Agentman Shopify Widget
 * Version: $VERSION
 * Build Date: $BUILD_DATE
 * CDN: https://cdn.agentman.ai/shopify/v1/widget.js
 */

EOF
cat "$SCRIPT_DIR/script-service/index.js" >> "$BUILD_DIR/cdn/shopify/v1/widget.js"

# Create minified version (simple copy for now)
cp "$BUILD_DIR/cdn/shopify/v1/widget.js" "$BUILD_DIR/cdn/shopify/v1/widget.min.js"

# Copy core widget from parent dist
echo -e "${YELLOW}Copying core widget...${NC}"
mkdir -p "$BUILD_DIR/cdn/core"
cp "$SCRIPT_DIR/../dist/index.js" "$BUILD_DIR/cdn/core/chat-widget.js"

# Copy configuration tool
echo -e "${YELLOW}Copying configuration tool...${NC}"
cp -r "$SCRIPT_DIR/config-tool/"* "$BUILD_DIR/cdn/shopify/config-tool/"

# Copy documentation
echo -e "${YELLOW}Copying documentation...${NC}"
cp -r "$SCRIPT_DIR/docs/"* "$BUILD_DIR/cdn/shopify/docs/"

# Create version manifest
echo -e "${YELLOW}Creating version manifest...${NC}"
cat > "$BUILD_DIR/cdn/shopify/version.json" << EOF
{
    "version": "$VERSION",
    "buildDate": "$BUILD_DATE",
    "files": {
        "widget": "/v1/widget.js",
        "widgetMin": "/v1/widget.min.js",
        "configTool": "/config-tool/index.html",
        "documentation": "/docs/installation.html"
    }
}
EOF

# Create deployment instructions
cat > "$BUILD_DIR/DEPLOYMENT.md" << 'EOF'
# Shopify Widget Deployment Instructions

## Files to Deploy

This build contains all files needed for the Shopify widget CDN deployment.

### Directory Structure
```
cdn/shopify/
├── v1/
│   ├── widget.js         # Main widget script
│   └── widget.min.js     # Minified version
├── config-tool/          # Configuration tool
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── docs/                 # Documentation
│   ├── installation.md
│   └── troubleshooting.md
└── version.json          # Version manifest
```

### CDN Deployment Options

#### Option 1: AWS S3 + CloudFront
1. Upload the entire `cdn/shopify/` directory to your S3 bucket
2. Set appropriate cache headers:
   - `/v1/*` - Cache for 1 year (immutable)
   - `/config-tool/*` - Cache for 1 hour
   - `/docs/*` - Cache for 1 hour
   - `/version.json` - Cache for 5 minutes

#### Option 2: Netlify (Quick Testing)
1. Drag and drop the `cdn` folder to Netlify
2. Configure headers in `_headers` file
3. Use the provided URL for testing

#### Option 3: GitHub Pages (Free Option)
1. Create a new repository
2. Push the `cdn` contents
3. Enable GitHub Pages
4. Use jsdelivr CDN: `https://cdn.jsdelivr.net/gh/[user]/[repo]/shopify/v1/widget.js`

### Testing URLs

After deployment, your URLs will be:
- Widget: `https://[your-cdn]/shopify/v1/widget.js`
- Config Tool: `https://[your-cdn]/shopify/config-tool/index.html`
- Docs: `https://[your-cdn]/shopify/docs/installation.html`

### Script Tag for Stores
```html
<script src="https://[your-cdn]/shopify/v1/widget.js" 
        data-agent-token="YOUR_AGENT_TOKEN"></script>
```
EOF

# Create a simple HTTP server script for testing
cat > "$BUILD_DIR/test-server.js" << 'EOF'
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = path.join(__dirname, 'cdn');

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.md': 'text/markdown'
};

http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    let filePath = path.join(ROOT, req.url);
    
    // Default to index.html for directories
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('404 Not Found');
            return;
        }
        
        const ext = path.extname(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
}).listen(PORT);

console.log(`\n🚀 Test server running at http://localhost:${PORT}`);
console.log(`📝 Widget URL: http://localhost:${PORT}/shopify/v1/widget.js`);
console.log(`🎨 Config Tool: http://localhost:${PORT}/shopify/config-tool/index.html`);
console.log(`\nPress Ctrl+C to stop\n`);
EOF

echo -e "\n${GREEN}✅ Build completed successfully!${NC}"
echo -e "${GREEN}📁 Output directory: $BUILD_DIR${NC}"
echo -e "\n${BLUE}Next Steps:${NC}"
echo "1. Test locally: cd $BUILD_DIR && node test-server.js"
echo "2. Deploy to your CDN of choice (see DEPLOYMENT.md)"
echo "3. Update script URLs in documentation"
echo ""