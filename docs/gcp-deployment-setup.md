# Google Cloud Platform Deployment Setup

This guide explains how to set up Google Cloud Platform (GCP) deployment for the Shopify widget using Workload Identity Federation. This allows GitHub Actions to securely deploy to Google Cloud Storage without storing service account keys.

## Prerequisites

- Google Cloud SDK (`gcloud`) installed locally
- A Google Cloud Project with billing enabled
- Owner or IAM Admin permissions on the GCP project
- Access to the GitHub repository settings

## Overview

The Shopify widget is deployed to Google Cloud Storage (GCS) and served via CDN. The deployment process uses:
- **Workload Identity Federation**: Secure, keyless authentication from GitHub Actions
- **Service Account**: Minimal permissions for deployment
- **GitHub Actions**: Automated deployment workflow

## Step 1: Enable Required APIs

Enable the necessary Google Cloud APIs:

```bash
gcloud services enable \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  cloudresourcemanager.googleapis.com \
  storage.googleapis.com
```

## Step 2: Create Workload Identity Pool

Create a pool to manage external identities:

```bash
gcloud iam workload-identity-pools create "github-actions-pool" \
  --location="global" \
  --display-name="GitHub Actions Pool" \
  --description="Workload Identity Pool for GitHub Actions"
```

## Step 3: Create OIDC Provider

Configure GitHub as an identity provider:

```bash
# Replace YOUR_GITHUB_ORG with your GitHub organization name
gcloud iam workload-identity-pools providers create-oidc "github-actions-provider" \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --display-name="GitHub Actions Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == 'YOUR_GITHUB_ORG'" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

## Step 4: Create Service Account

Create a dedicated service account for deployments:

```bash
gcloud iam service-accounts create github-actions-shopify \
  --display-name="GitHub Actions Shopify Deploy" \
  --description="Service account for GitHub Actions to deploy Shopify widget"
```

## Step 5: Grant Storage Permissions

Grant the service account permission to manage objects in GCS:

```bash
# Replace YOUR_PROJECT_ID with your GCP project ID
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions-shopify@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

## Step 6: Configure Workload Identity Binding

Allow the GitHub repository to impersonate the service account:

```bash
# Replace YOUR_PROJECT_NUMBER with your GCP project number
# Replace YOUR_GITHUB_ORG/YOUR_REPO with your GitHub repository
gcloud iam service-accounts add-iam-policy-binding \
  "github-actions-shopify@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --member="principalSet://iam.googleapis.com/projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/YOUR_GITHUB_ORG/YOUR_REPO" \
  --role="roles/iam.workloadIdentityUser"
```

## Step 7: Create Storage Bucket

If you haven't already, create the storage bucket:

```bash
# Create bucket with appropriate settings
gsutil mb -p YOUR_PROJECT_ID -c STANDARD -l US gs://YOUR_BUCKET_NAME/

# Enable public access for serving files
gsutil iam ch allUsers:objectViewer gs://YOUR_BUCKET_NAME

# Set CORS policy (create cors.json first)
gsutil cors set cors.json gs://YOUR_BUCKET_NAME
```

Example `cors.json`:
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

## Step 8: Get Provider and Service Account Details

Retrieve the values needed for GitHub secrets:

```bash
# Get Workload Identity Provider resource name
gcloud iam workload-identity-pools providers describe github-actions-provider \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --format="value(name)"

# Get Service Account email
echo "github-actions-shopify@YOUR_PROJECT_ID.iam.gserviceaccount.com"
```

## Step 9: Configure GitHub Secrets

1. Go to your repository's Settings → Secrets and variables → Actions
2. Add the following repository secrets:

| Secret Name | Value |
|------------|-------|
| `WIF_PROVIDER` | The provider resource name from Step 8 |
| `WIF_SERVICE_ACCOUNT` | The service account email from Step 8 |

## Step 10: Test the Configuration

Use the provided test workflow to verify the setup:

```yaml
name: Test GCP Authentication

on:
  workflow_dispatch:

permissions:
  contents: read
  id-token: write

jobs:
  test-auth:
    name: Test GCP Authentication
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

      - name: Setup Google Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Test GCS Access
        run: |
          echo "Testing access to GCS..."
          gsutil ls gs://YOUR_BUCKET_NAME/ || echo "Bucket not accessible"
```

## Security Best Practices

1. **Principle of Least Privilege**: The service account only has storage permissions
2. **Repository Binding**: Only the specified repository can use the service account
3. **No Keys**: No service account keys are created or stored
4. **Audit Trail**: All actions are logged in Cloud Audit Logs

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**
   - Verify the service account has the correct roles
   - Check the workload identity binding is correct
   - Ensure the repository path matches exactly

2. **"Token exchange failed"**
   - Verify the WIF provider configuration
   - Check that `id-token: write` permission is set in the workflow
   - Ensure the organization condition matches

3. **"Bucket not found"**
   - Verify the bucket exists and is in the correct project
   - Check the bucket name is correct in the workflow

### Debugging Commands

```bash
# List workload identity pools
gcloud iam workload-identity-pools list --location=global

# List providers
gcloud iam workload-identity-pools providers list \
  --workload-identity-pool="github-actions-pool" \
  --location=global

# Check service account permissions
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:github-actions-shopify@*"

# View service account details
gcloud iam service-accounts describe \
  github-actions-shopify@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

## Cleanup

If you need to remove the setup:

```bash
# Delete service account
gcloud iam service-accounts delete \
  github-actions-shopify@YOUR_PROJECT_ID.iam.gserviceaccount.com

# Delete workload identity provider
gcloud iam workload-identity-pools providers delete github-actions-provider \
  --location="global" \
  --workload-identity-pool="github-actions-pool"

# Delete workload identity pool
gcloud iam workload-identity-pools delete github-actions-pool \
  --location="global"
```

## References

- [Workload Identity Federation Documentation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [GitHub Actions OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [Google GitHub Actions Auth](https://github.com/google-github-actions/auth)