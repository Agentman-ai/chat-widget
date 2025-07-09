#!/bin/bash

# Shopify Widget CDN Deployment Script
# Deploys the Shopify integration to CDN for global distribution

set -e  # Exit on any error

# Configuration
CDN_BUCKET="agentman-shopify-cdn"
CDN_DISTRIBUTION="shopify.agentman.ai"
VERSION_FILE="version.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="$SCRIPT_DIR/build"
VERSIONS_DIR="$SCRIPT_DIR/versions"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Version management
get_current_version() {
    if [ -f "$VERSIONS_DIR/$VERSION_FILE" ]; then
        cat "$VERSIONS_DIR/$VERSION_FILE" | jq -r '.version'
    else
        echo "1.0.0"
    fi
}

increment_version() {
    local current_version=$1
    local version_type=${2:-patch}  # patch, minor, major
    
    IFS='.' read -ra ADDR <<< "$current_version"
    local major=${ADDR[0]}
    local minor=${ADDR[1]}
    local patch=${ADDR[2]}
    
    case $version_type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
    esac
    
    echo "$major.$minor.$patch"
}

# Build functions
create_build_directory() {
    log_info "Creating build directory..."
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR/v1"
    mkdir -p "$BUILD_DIR/config-tool"
    mkdir -p "$BUILD_DIR/docs"
}

build_script_service() {
    log_info "Building script service..."
    
    # Copy and minify the main script
    cp "$PROJECT_ROOT/script-service/index.js" "$BUILD_DIR/v1/widget.js"
    
    # Add version and build info
    local version=$1
    local build_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Inject version info at the top of the script
    cat > "$BUILD_DIR/v1/widget.js.tmp" << EOF
/**
 * Agentman Shopify Widget
 * Version: $version
 * Build Date: $build_date
 * CDN: https://cdn.agentman.ai/shopify/v1/widget.js
 */

EOF
    cat "$BUILD_DIR/v1/widget.js" >> "$BUILD_DIR/v1/widget.js.tmp"
    mv "$BUILD_DIR/v1/widget.js.tmp" "$BUILD_DIR/v1/widget.js"
    
    # Create minified version if uglifyjs is available
    if command -v uglifyjs &> /dev/null; then
        log_info "Minifying script..."
        uglifyjs "$BUILD_DIR/v1/widget.js" \
            --compress \
            --mangle \
            --output "$BUILD_DIR/v1/widget.min.js" \
            --comments '/Version:|Build Date:|CDN:/'
    else
        log_warning "uglifyjs not found, skipping minification"
        cp "$BUILD_DIR/v1/widget.js" "$BUILD_DIR/v1/widget.min.js"
    fi
    
    log_success "Script service built successfully"
}

build_config_tool() {
    log_info "Building configuration tool..."
    
    # Copy config tool files
    cp "$PROJECT_ROOT/config-tool/"* "$BUILD_DIR/config-tool/" 2>/dev/null || true
    
    # Create templates directory and copy templates
    mkdir -p "$BUILD_DIR/config-tool/templates"
    
    # Generate template files
    cat > "$BUILD_DIR/config-tool/templates/default.json" << 'EOF'
{
    "name": "Default Configuration",
    "description": "General purpose assistant for any store type",
    "config": {
        "variant": "corner",
        "position": "bottom-right",
        "theme": {
            "backgroundColor": "#ffffff",
            "textColor": "#111827",
            "buttonColor": "#2563eb",
            "buttonTextColor": "#ffffff",
            "agentForegroundColor": "#111827",
            "userForegroundColor": "#2563eb",
            "toggleBackgroundColor": "#2563eb",
            "toggleTextColor": "#ffffff",
            "toggleIconColor": "#ffffff"
        },
        "title": "AI Assistant",
        "toggleText": "Ask Agentman",
        "placeholder": "Ask me anything...",
        "initialMessage": "Hello! How can I help you today?",
        "messagePrompts": {
            "show": true,
            "welcome_message": "How can I help you today?",
            "prompts": [
                "What can you do?",
                "Help me get started",
                "Tell me about your services"
            ]
        },
        "persistence": {
            "enabled": true,
            "days": 7
        },
        "hideBranding": true,
        "shopifyIntegration": {
            "customerData": true,
            "cartSync": true,
            "orderLookup": true
        }
    }
}
EOF

    cat > "$BUILD_DIR/config-tool/templates/ecommerce.json" << 'EOF'
{
    "name": "E-commerce Optimized",
    "description": "Perfect for online stores with product support focus",
    "config": {
        "variant": "corner",
        "position": "bottom-right",
        "theme": {
            "backgroundColor": "#ffffff",
            "textColor": "#111827",
            "buttonColor": "#059669",
            "buttonTextColor": "#ffffff",
            "agentForegroundColor": "#111827",
            "userForegroundColor": "#059669",
            "toggleBackgroundColor": "#059669",
            "toggleTextColor": "#ffffff",
            "toggleIconColor": "#ffffff"
        },
        "title": "Shopping Assistant",
        "toggleText": "Need Help?",
        "placeholder": "Ask about products, orders, or returns...",
        "initialMessage": "Hi! I'm here to help you find what you're looking for!",
        "messagePrompts": {
            "show": true,
            "welcome_message": "What can I help you find today?",
            "prompts": [
                "Product recommendations",
                "Size guide",
                "Shipping information"
            ]
        },
        "persistence": {
            "enabled": true,
            "days": 14
        },
        "hideBranding": true,
        "shopifyIntegration": {
            "customerData": true,
            "cartSync": true,
            "orderLookup": true
        }
    }
}
EOF

    cat > "$BUILD_DIR/config-tool/templates/support.json" << 'EOF'
{
    "name": "Customer Support",
    "description": "Focused on customer service and support queries",
    "config": {
        "variant": "corner",
        "position": "bottom-right",
        "theme": {
            "backgroundColor": "#ffffff",
            "textColor": "#111827",
            "buttonColor": "#dc2626",
            "buttonTextColor": "#ffffff",
            "agentForegroundColor": "#111827",
            "userForegroundColor": "#dc2626",
            "toggleBackgroundColor": "#dc2626",
            "toggleTextColor": "#ffffff",
            "toggleIconColor": "#ffffff"
        },
        "title": "Customer Support",
        "toggleText": "Get Support",
        "placeholder": "How can we help you?",
        "initialMessage": "Hello! I'm here to help with any questions or issues.",
        "messagePrompts": {
            "show": true,
            "welcome_message": "How can I assist you today?",
            "prompts": [
                "Track my order",
                "Return policy",
                "Contact information"
            ]
        },
        "persistence": {
            "enabled": true,
            "days": 30
        },
        "hideBranding": true,
        "shopifyIntegration": {
            "customerData": true,
            "cartSync": true,
            "orderLookup": true
        }
    }
}
EOF

    log_success "Configuration tool built successfully"
}

build_documentation() {
    log_info "Building documentation..."
    
    # Copy documentation files
    cp -r "$PROJECT_ROOT/docs/"* "$BUILD_DIR/docs/" 2>/dev/null || true
    
    # Create index.html for docs
    cat > "$BUILD_DIR/docs/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agentman Shopify Integration - Documentation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
        h1 { color: #2563eb; }
        .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
        .btn { display: inline-block; background: #2563eb; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 6px; margin: 0.5rem 0; }
    </style>
</head>
<body>
    <h1>🛒 Agentman for Shopify</h1>
    <p>Complete integration guide and tools for adding AI chat to your Shopify store.</p>
    
    <div class="card">
        <h3>🚀 Quick Start</h3>
        <p>Get your chat widget running in less than 5 minutes</p>
        <a href="installation.html" class="btn">Installation Guide →</a>
    </div>
    
    <div class="card">
        <h3>🎨 Configuration Tool</h3>
        <p>Customize your widget appearance and behavior</p>
        <a href="../config-tool/index.html" class="btn">Configure Widget →</a>
    </div>
    
    <div class="card">
        <h3>🛠️ Troubleshooting</h3>
        <p>Common issues and solutions</p>
        <a href="troubleshooting.html" class="btn">Get Help →</a>
    </div>
    
    <div class="card">
        <h3>📖 Complete Documentation</h3>
        <p>Full integration guide with advanced options</p>
        <a href="../README.md" class="btn">Read Docs →</a>
    </div>
    
    <hr style="margin: 2rem 0;">
    <p><small>Need help? Contact us at <a href="mailto:support@agentman.ai">support@agentman.ai</a></small></p>
</body>
</html>
EOF

    log_success "Documentation built successfully"
}

create_version_manifest() {
    local version=$1
    local build_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    log_info "Creating version manifest..."
    
    # Ensure versions directory exists
    mkdir -p "$VERSIONS_DIR"
    
    # Create version manifest
    cat > "$BUILD_DIR/$VERSION_FILE" << EOF
{
    "version": "$version",
    "buildDate": "$build_date",
    "files": {
        "widget": "/v1/widget.js",
        "widgetMin": "/v1/widget.min.js",
        "configTool": "/config-tool/index.html",
        "documentation": "/docs/index.html"
    },
    "cdn": {
        "baseUrl": "https://cdn.agentman.ai/shopify",
        "distribution": "$CDN_DISTRIBUTION"
    },
    "integrity": {
        "widget": "$(sha256sum "$BUILD_DIR/v1/widget.js" | cut -d' ' -f1)",
        "widgetMin": "$(sha256sum "$BUILD_DIR/v1/widget.min.js" | cut -d' ' -f1)"
    }
}
EOF

    # Save version info
    cp "$BUILD_DIR/$VERSION_FILE" "$VERSIONS_DIR/"
    
    log_success "Version manifest created: $version"
}

# Deployment functions
deploy_to_s3() {
    local version=$1
    
    log_info "Deploying to S3..."
    
    # Check if AWS CLI is available
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install and configure AWS CLI."
        exit 1
    fi
    
    # Deploy files with appropriate cache headers
    log_info "Uploading script files..."
    aws s3 cp "$BUILD_DIR/v1/" "s3://$CDN_BUCKET/v1/" \
        --recursive \
        --cache-control "public, max-age=31536000" \
        --content-type "application/javascript"
    
    log_info "Uploading config tool..."
    aws s3 cp "$BUILD_DIR/config-tool/" "s3://$CDN_BUCKET/config-tool/" \
        --recursive \
        --cache-control "public, max-age=3600"
    
    log_info "Uploading documentation..."
    aws s3 cp "$BUILD_DIR/docs/" "s3://$CDN_BUCKET/docs/" \
        --recursive \
        --cache-control "public, max-age=3600"
    
    log_info "Uploading version manifest..."
    aws s3 cp "$BUILD_DIR/$VERSION_FILE" "s3://$CDN_BUCKET/$VERSION_FILE" \
        --cache-control "public, max-age=300" \
        --content-type "application/json"
    
    log_success "Deployment to S3 completed"
}

invalidate_cloudfront() {
    log_info "Invalidating CloudFront cache..."
    
    # Invalidate cache for updated files
    aws cloudfront create-invalidation \
        --distribution-id "$CDN_DISTRIBUTION" \
        --paths "/*" \
        --output text
    
    log_success "CloudFront invalidation initiated"
}

# Verification functions
verify_deployment() {
    local version=$1
    
    log_info "Verifying deployment..."
    
    # Check if main script is accessible
    local script_url="https://cdn.agentman.ai/shopify/v1/widget.js"
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$script_url")
    
    if [ "$status_code" = "200" ]; then
        log_success "Script accessible at $script_url"
    else
        log_error "Script not accessible (HTTP $status_code)"
        return 1
    fi
    
    # Check version manifest
    local manifest_url="https://cdn.agentman.ai/shopify/version.json"
    local manifest_version=$(curl -s "$manifest_url" | jq -r '.version' 2>/dev/null)
    
    if [ "$manifest_version" = "$version" ]; then
        log_success "Version manifest updated successfully"
    else
        log_warning "Version manifest may not be updated yet (got: $manifest_version, expected: $version)"
    fi
    
    # Check config tool
    local config_url="https://cdn.agentman.ai/shopify/config-tool/index.html"
    local config_status=$(curl -s -o /dev/null -w "%{http_code}" "$config_url")
    
    if [ "$config_status" = "200" ]; then
        log_success "Configuration tool accessible"
    else
        log_warning "Configuration tool may not be accessible yet"
    fi
}

# Main deployment function
deploy() {
    local version_type=${1:-patch}
    local current_version=$(get_current_version)
    local new_version=$(increment_version "$current_version" "$version_type")
    
    log_info "Starting deployment process..."
    log_info "Current version: $current_version"
    log_info "New version: $new_version"
    
    # Build process
    create_build_directory
    build_script_service "$new_version"
    build_config_tool
    build_documentation
    create_version_manifest "$new_version"
    
    # Deploy process
    deploy_to_s3 "$new_version"
    invalidate_cloudfront
    
    # Verification
    sleep 10  # Wait for propagation
    verify_deployment "$new_version"
    
    log_success "Deployment completed successfully! 🎉"
    log_info "New version: $new_version"
    log_info "CDN URLs:"
    log_info "  - Script: https://cdn.agentman.ai/shopify/v1/widget.js"
    log_info "  - Config: https://cdn.agentman.ai/shopify/config-tool/index.html"
    log_info "  - Docs: https://cdn.agentman.ai/shopify/docs/index.html"
}

# Script usage
usage() {
    echo "Usage: $0 [patch|minor|major]"
    echo ""
    echo "Deploy Shopify widget to CDN with version bump:"
    echo "  patch  - Bug fixes (1.0.0 -> 1.0.1)"
    echo "  minor  - New features (1.0.0 -> 1.1.0)"
    echo "  major  - Breaking changes (1.0.0 -> 2.0.0)"
    echo ""
    echo "Examples:"
    echo "  $0 patch   # Deploy bug fix"
    echo "  $0 minor   # Deploy new feature"
    echo "  $0 major   # Deploy breaking change"
}

# Main execution
main() {
    case ${1:-patch} in
        patch|minor|major)
            deploy "$1"
            ;;
        -h|--help|help)
            usage
            ;;
        *)
            log_error "Invalid version type: $1"
            usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"