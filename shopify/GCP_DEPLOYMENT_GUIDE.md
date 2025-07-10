# GCP Deployment Guide for Shopify Widget

## Quick Start

### Step 1: Prerequisites

1. **Install Google Cloud SDK**
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate with Google Cloud**
   ```bash
   gcloud auth login
   ```

3. **Set up your project**
   ```bash
   # List available projects
   gcloud projects list
   
   # Set your project
   gcloud config set project YOUR_PROJECT_ID
   ```

### Step 2: Configure Deployment Script

Edit the `deploy-gcp.sh` file and update these variables:

```bash
# Configuration - UPDATE THESE VALUES
PROJECT_ID="your-project-id"           # Your GCP project ID
BUCKET_NAME="agentman-shopify-cdn"     # Unique bucket name
CDN_DOMAIN="shopify.agentman.ai"       # Optional custom domain
REGION="us-central1"                   # GCS region
```

### Step 3: Deploy

```bash
# First, build the files
./deploy-local.sh

# Then deploy to GCP
./deploy-gcp.sh deploy
```

## Deployment Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Shopify Store │    │  Google Cloud    │    │  Agentman API   │
│                 │    │                  │    │                 │
│  <script src=   │───▶│  Cloud Storage   │    │  Agent Runtime  │
│   "gcs-url">    │    │  + Cloud CDN     │    │                 │
│                 │    │                  │    │                 │
│  Chat Widget    │◀───│  Static Files    │    │                 │
│                 │    │  - widget.js     │    │                 │
│                 │────┼──────────────────┼───▶│  Direct API     │
│                 │    │  - config-tool   │    │  Calls          │
└─────────────────┘    │  - docs          │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## What Gets Deployed

### File Structure on GCS
```
gs://your-bucket/shopify/
├── v1/
│   ├── widget.js         # Main widget script
│   └── widget.min.js     # Minified version
├── config-tool/          # Configuration interface
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── docs/                 # Documentation
│   ├── installation.md
│   └── troubleshooting.md
└── version.json          # Version manifest
```

### Cache Headers Applied
- **Widget scripts** (`/v1/*.js`): 1 year cache (immutable)
- **Config tool** (`/config-tool/*`): 1 hour cache
- **Documentation** (`/docs/*`): 1 hour cache
- **Version manifest** (`/version.json`): 5 minutes cache

## URLs After Deployment

After successful deployment, you'll get:

```
✅ Widget Script: https://storage.googleapis.com/your-bucket/shopify/v1/widget.js
✅ Config Tool:   https://storage.googleapis.com/your-bucket/shopify/config-tool/index.html
✅ Documentation: https://storage.googleapis.com/your-bucket/shopify/docs/installation.md
```

### Custom Domain (Optional)

If you set up a custom domain, URLs become:
```
✅ Widget Script: https://cdn.agentman.ai/shopify/v1/widget.js
✅ Config Tool:   https://cdn.agentman.ai/shopify/config-tool/index.html
```

## Shopify Installation

After deployment, store owners use this script tag:

```html
<script src="https://storage.googleapis.com/your-bucket/shopify/v1/widget.js" 
        data-agent-token="THEIR_AGENT_TOKEN"></script>
```

## GCP Services Used

### 1. Cloud Storage
- **Purpose**: Host static files (widget script, config tool, docs)
- **Cost**: ~$0.02/GB/month + bandwidth costs
- **Benefits**: High availability, global distribution

### 2. Cloud CDN (Optional)
- **Purpose**: Global edge caching for faster loading
- **Cost**: ~$0.08/GB for cache egress
- **Benefits**: Lower latency worldwide

### 3. Cloud DNS (If using custom domain)
- **Purpose**: Custom domain management
- **Cost**: ~$0.40/month per zone
- **Benefits**: Professional URLs

## Cost Estimation

For typical usage (10-50 stores):

| Service | Monthly Cost |
|---------|-------------|
| Cloud Storage (1GB) | $0.02 |
| Bandwidth (10GB) | $1.20 |
| Cloud CDN (optional) | $0.80 |
| **Total** | **~$2/month** |

## Security & Performance

### Security Features
- ✅ HTTPS enforced
- ✅ CORS configured
- ✅ Public read-only access
- ✅ No sensitive data stored

### Performance Features
- ✅ Global CDN distribution
- ✅ Optimized cache headers
- ✅ Gzip compression
- ✅ HTTP/2 support

## Monitoring & Maintenance

### Built-in Monitoring
```bash
# Check deployment status
./deploy-gcp.sh test

# View GCS usage
gsutil du -sh gs://your-bucket

# Check access logs
gcloud logging read "resource.type=gcs_bucket" --limit=50
```

### Updates
```bash
# Update widget code
./deploy-local.sh      # Rebuild files
./deploy-gcp.sh deploy # Deploy updates
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   # Ensure you have the right roles
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
       --member="user:your-email@domain.com" \
       --role="roles/storage.admin"
   ```

2. **Bucket Already Exists**
   ```bash
   # Choose a different bucket name
   # Bucket names must be globally unique
   ```

3. **Files Not Accessible**
   ```bash
   # Check bucket permissions
   gsutil iam get gs://your-bucket
   
   # Make sure allUsers has objectViewer role
   gsutil iam ch allUsers:objectViewer gs://your-bucket
   ```

## Advanced Configuration

### Custom Domain Setup

1. **Reserve Static IP**
   ```bash
   gcloud compute addresses create shopify-widget-ip --global
   ```

2. **Create SSL Certificate**
   ```bash
   gcloud compute ssl-certificates create shopify-widget-ssl \
       --domains=cdn.agentman.ai \
       --global
   ```

3. **Set up Load Balancer**
   ```bash
   # Create HTTPS load balancer pointing to your backend bucket
   # Configure in Google Cloud Console or via gcloud
   ```

### Content Versioning

The deployment script supports automatic versioning:
- Files are immutable once deployed
- Version manifest tracks current version
- Easy rollback by updating manifest

## Next Steps

1. **Deploy**: Run the deployment script
2. **Test**: Verify all URLs work correctly
3. **Document**: Update your documentation with the new URLs
4. **Integrate**: Update configuration tool to use new CDN URLs
5. **Launch**: Start onboarding pilot customers

## Support

If you encounter issues:
- Check GCP Console for detailed error messages
- Use `gcloud logs` to view deployment logs
- Contact GCP support for infrastructure issues