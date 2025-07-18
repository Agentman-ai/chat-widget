#!/bin/bash

# Upload CDN distribution to cloud storage
# Usage: ./scripts/upload-cdn.sh [bucket-name] [project-id]

BUCKET_NAME=${1:-"agentman-chat-widget-cdn"}
PROJECT_ID=${2:-"your-gcp-project"}
CDN_DIST_DIR="cdn-dist"

echo "🚀 Uploading CDN distribution to Google Cloud Storage"
echo "   Bucket: gs://$BUCKET_NAME"
echo "   Project: $PROJECT_ID"
echo ""

# Check if gcloud is installed
if ! command -v gsutil &> /dev/null; then
    echo "❌ gsutil is not installed. Please install Google Cloud SDK."
    exit 1
fi

# Check if cdn-dist exists
if [ ! -d "$CDN_DIST_DIR" ]; then
    echo "❌ CDN distribution not found. Run 'npm run build:cdn' first."
    exit 1
fi

# Set CORS configuration for the bucket
echo "📝 Setting CORS configuration..."
cat > cors-config.json << EOF
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors-config.json gs://$BUCKET_NAME
rm cors-config.json

# Upload files with appropriate cache headers
echo "📤 Uploading versioned files (immutable)..."
# Versioned files can be cached forever
gsutil -m -h "Cache-Control:public, max-age=31536000, immutable" \
  cp -r $CDN_DIST_DIR/1.0.0/* gs://$BUCKET_NAME/chat-widget/1.0.0/

echo "📤 Uploading latest files (1 hour cache)..."
# Latest files should have shorter cache
gsutil -m -h "Cache-Control:public, max-age=3600" \
  cp -r $CDN_DIST_DIR/latest/* gs://$BUCKET_NAME/chat-widget/latest/

echo "📤 Uploading v1/v2 files (1 hour cache)..."
gsutil -m -h "Cache-Control:public, max-age=3600" \
  cp -r $CDN_DIST_DIR/v2/* gs://$BUCKET_NAME/chat-widget/v2/

# Upload index.html
echo "📤 Uploading index.html..."
gsutil -h "Cache-Control:public, max-age=300" \
  -h "Content-Type:text/html" \
  cp $CDN_DIST_DIR/index.html gs://$BUCKET_NAME/chat-widget/index.html

# Make files publicly readable
echo "🔓 Setting public access..."
gsutil -m acl ch -u AllUsers:R gs://$BUCKET_NAME/chat-widget/**

echo ""
echo "✅ Upload complete!"
echo ""
echo "🌐 CDN URLs:"
echo "   Latest: https://cdn.agentman.ai/chat-widget/latest/chat-widget.min.js"
echo "   v2: https://cdn.agentman.ai/chat-widget/v2/chat-widget.min.js"
echo "   1.0.0: https://cdn.agentman.ai/chat-widget/1.0.0/chat-widget.min.js"
echo "   Docs: https://cdn.agentman.ai/chat-widget/"
echo ""
echo "📊 Test the CDN:"
echo "   curl -I https://cdn.agentman.ai/chat-widget/latest/chat-widget.min.js"