#!/bin/bash

# GCP Deployment Script for Shopify Widget
# Uses Google Cloud Storage + Cloud CDN for global distribution

set -e

# Configuration - UPDATE THESE VALUES
PROJECT_ID="agentman-public-cloud-storage"
BUCKET_NAME="chatwidget-shopify-storage-for-cdn"
REGION="us-west2"

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/dist"
VERSION_FILE="version.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        log_error "Google Cloud SDK not found. Please install it:"
        echo "  https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    # Check if authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_error "Not authenticated with Google Cloud. Please run:"
        echo "  gcloud auth login"
        exit 1
    fi
    
    # Set the project to match our configuration
    log_info "Setting project to: $PROJECT_ID"
    gcloud config set project "$PROJECT_ID"
    
    # Verify project is set correctly
    local current_project=$(gcloud config get-value project 2>/dev/null)
    if [[ "$current_project" != "$PROJECT_ID" ]]; then
        log_error "Failed to set project to $PROJECT_ID. Current: $current_project"
        exit 1
    fi
    
    log_info "Using project: $current_project"
    
    log_success "Prerequisites check completed"
}

# Create GCS bucket if it doesn't exist
setup_bucket() {
    log_info "Setting up GCS bucket: $BUCKET_NAME"
    
    # Check if bucket exists
    if gsutil ls -b "gs://$BUCKET_NAME" &>/dev/null; then
        log_info "Bucket already exists: $BUCKET_NAME"
    else
        log_info "Creating bucket: $BUCKET_NAME"
        gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://$BUCKET_NAME"
        
        # Make bucket publicly readable
        gsutil iam ch allUsers:objectViewer "gs://$BUCKET_NAME"
        
        log_success "Bucket created and configured for public access"
    fi
    
    # Set up CORS for the bucket
    log_info "Configuring CORS..."
    cat > /tmp/cors.json << 'EOF'
[
    {
        "origin": ["*"],
        "method": ["GET", "HEAD"],
        "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
        "maxAgeSeconds": 3600
    }
]
EOF
    gsutil cors set /tmp/cors.json "gs://$BUCKET_NAME"
    rm /tmp/cors.json
    
    log_success "CORS configured"
}

# Deploy files to GCS with appropriate cache headers
deploy_files() {
    log_info "Deploying files to GCS..."
    
    # Deploy widget scripts with long cache (immutable)
    log_info "Uploading widget scripts..."
    gsutil -h "Cache-Control:public, max-age=31536000, immutable" \
           -h "Content-Type:application/javascript" \
           cp "$BUILD_DIR/cdn/shopify/v1/"*.js "gs://$BUCKET_NAME/shopify/v1/"
    
    # Deploy core widget
    log_info "Uploading core widget..."
    gsutil -h "Cache-Control:public, max-age=31536000, immutable" \
           -h "Content-Type:application/javascript" \
           cp "$BUILD_DIR/cdn/core/chat-widget.js" "gs://$BUCKET_NAME/core/"
    
    # Deploy configuration tool with short cache
    log_info "Uploading configuration tool..."
    gsutil -h "Cache-Control:public, max-age=3600" \
           -m cp -r "$BUILD_DIR/cdn/shopify/config-tool" "gs://$BUCKET_NAME/shopify/"
    
    # Deploy documentation with short cache
    log_info "Uploading documentation..."
    gsutil -h "Cache-Control:public, max-age=3600" \
           -m cp -r "$BUILD_DIR/cdn/shopify/docs" "gs://$BUCKET_NAME/shopify/"
    
    # Deploy version manifest with very short cache
    log_info "Uploading version manifest..."
    gsutil -h "Cache-Control:public, max-age=300" \
           -h "Content-Type:application/json" \
           cp "$BUILD_DIR/cdn/shopify/version.json" "gs://$BUCKET_NAME/shopify/"
    
    log_success "All files deployed to GCS"
}

# Set up Cloud CDN (optional but recommended)
setup_cdn() {
    log_info "Setting up Cloud CDN..."
    
    # Create backend bucket
    local backend_bucket_name="shopify-widget-backend"
    
    # Check if backend bucket already exists
    if gcloud compute backend-buckets describe "$backend_bucket_name" &>/dev/null; then
        log_info "Backend bucket already exists"
    else
        log_info "Creating backend bucket..."
        gcloud compute backend-buckets create "$backend_bucket_name" \
            --gcs-bucket-name="$BUCKET_NAME"
    fi
    
    # Create URL map
    local url_map_name="shopify-widget-url-map"
    if gcloud compute url-maps describe "$url_map_name" &>/dev/null; then
        log_info "URL map already exists"
    else
        log_info "Creating URL map..."
        gcloud compute url-maps create "$url_map_name" \
            --default-backend-bucket="$backend_bucket_name"
    fi
    
    # Create HTTPS target proxy
    local target_proxy_name="shopify-widget-https-proxy"
    if gcloud compute target-https-proxies describe "$target_proxy_name" &>/dev/null; then
        log_info "HTTPS proxy already exists"
    else
        log_warning "HTTPS proxy creation requires an SSL certificate"
        log_info "You can create one manually or use a managed certificate"
        log_info "For now, creating HTTP proxy only..."
        
        # Create HTTP target proxy
        local http_proxy_name="shopify-widget-http-proxy"
        if ! gcloud compute target-http-proxies describe "$http_proxy_name" &>/dev/null; then
            gcloud compute target-http-proxies create "$http_proxy_name" \
                --url-map="$url_map_name"
        fi
    fi
    
    log_success "Cloud CDN setup completed"
}

# Generate deployment URLs
generate_urls() {
    log_info "Generating access URLs..."
    
    local base_url="https://storage.googleapis.com/$BUCKET_NAME"
    
    if [[ -n "$CDN_DOMAIN" ]]; then
        base_url="https://$CDN_DOMAIN"
    fi
    
    echo ""
    log_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Access URLs:"
    echo "   Widget Script: $base_url/shopify/v1/widget.js"
    echo "   Minified:      $base_url/shopify/v1/widget.min.js"
    echo "   Config Tool:   $base_url/shopify/config-tool/index.html"
    echo "   Documentation: $base_url/shopify/docs/installation.md"
    echo "   Version Info:  $base_url/shopify/version.json"
    echo ""
    echo "🛍️ Shopify Installation Script Tag:"
    echo "   <script src=\"$base_url/shopify/v1/widget.js\""
    echo "           data-agent-token=\"YOUR_AGENT_TOKEN\"></script>"
    echo ""
}

# Test deployment
test_deployment() {
    log_info "Testing deployment..."
    
    local base_url="https://storage.googleapis.com/$BUCKET_NAME"
    local widget_url="$base_url/shopify/v1/widget.js"
    
    # Test widget script accessibility
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$widget_url")
    if [[ "$status_code" = "200" ]]; then
        log_success "Widget script accessible ✅"
    else
        log_error "Widget script not accessible (HTTP $status_code)"
        return 1
    fi
    
    # Test version manifest
    local version_url="$base_url/shopify/version.json"
    local version_response=$(curl -s "$version_url")
    if [[ -n "$version_response" ]]; then
        log_success "Version manifest accessible ✅"
        echo "   Version: $(echo "$version_response" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)"
    else
        log_warning "Version manifest may not be accessible yet"
    fi
    
    log_success "Deployment test completed"
}

# Main deployment function
deploy() {
    log_info "🚀 Starting GCP deployment for Shopify Widget"
    
    # Check if build exists
    if [[ ! -d "$BUILD_DIR" ]]; then
        log_error "Build directory not found. Run ./deploy-local.sh first"
        exit 1
    fi
    
    # Run deployment steps
    check_prerequisites
    setup_bucket
    deploy_files
    
    # Optional CDN setup
    read -p "Do you want to set up Cloud CDN? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_cdn
    fi
    
    # Generate URLs and test
    generate_urls
    
    # Wait a moment for propagation
    log_info "Waiting for propagation..."
    sleep 5
    
    test_deployment
}

# Configuration helper
configure() {
    log_info "🔧 GCP Configuration Helper"
    echo ""
    
    # Get current project
    local current_project=$(gcloud config get-value project 2>/dev/null)
    echo "Current project: ${current_project:-"Not set"}"
    
    # Get projects list
    echo ""
    echo "Available projects:"
    gcloud projects list --format="table(projectId,name)" 2>/dev/null || echo "Run 'gcloud auth login' first"
    
    echo ""
    echo "To configure this script:"
    echo "1. Edit this file and update the variables at the top:"
    echo "   PROJECT_ID=\"your-project-id\""
    echo "   BUCKET_NAME=\"your-bucket-name\""
    echo "   CDN_DOMAIN=\"your-domain.com\"  # Optional"
    echo ""
    echo "2. Make sure you have the necessary permissions:"
    echo "   - Storage Admin (to create and manage buckets)"
    echo "   - Compute Admin (for Cloud CDN setup)"
    echo ""
    echo "3. Run: ./deploy-gcp.sh deploy"
}

# Cleanup function
cleanup() {
    log_warning "🧹 This will delete all deployed files and resources"
    read -p "Are you sure you want to cleanup? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Removing files from bucket..."
        gsutil -m rm -r "gs://$BUCKET_NAME/shopify/" 2>/dev/null || true
        
        log_info "Deleting bucket..."
        gsutil rb "gs://$BUCKET_NAME" 2>/dev/null || true
        
        log_success "Cleanup completed"
    else
        log_info "Cleanup cancelled"
    fi
}

# Usage information
usage() {
    echo "GCP Deployment Script for Shopify Widget"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  deploy     Deploy the widget to GCP"
    echo "  configure  Show configuration help"
    echo "  test       Test current deployment"
    echo "  cleanup    Remove all deployed resources"
    echo "  help       Show this help message"
    echo ""
    echo "Prerequisites:"
    echo "  1. Google Cloud SDK installed and configured"
    echo "  2. Authenticated with gcloud (gcloud auth login)"
    echo "  3. Project with billing enabled"
    echo "  4. Build files ready (run ./deploy-local.sh first)"
    echo ""
    echo "Configuration:"
    echo "  Edit the variables at the top of this script:"
    echo "  - PROJECT_ID: Your GCP project ID"
    echo "  - BUCKET_NAME: Unique bucket name for your CDN"
    echo "  - CDN_DOMAIN: Optional custom domain"
}

# Main execution
main() {
    case ${1:-deploy} in
        deploy)
            deploy
            ;;
        configure)
            configure
            ;;
        test)
            test_deployment
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            log_error "Unknown command: $1"
            usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"