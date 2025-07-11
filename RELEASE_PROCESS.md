# Release & Deployment Guide

This document outlines how to bump the version, build the widget, and deploy a new release of the Agentman Chat Widget.

## 🚀 Quick Start - Automated Release

The easiest way to release is using our GitHub Actions workflows:

1. Go to the [Actions tab](../../actions) in GitHub
2. Select "Release All Components" workflow
3. Click "Run workflow" and choose:
   - `release_type`: patch, minor, or major
   - `components`: all (or specific components)
   - `dry_run`: true (to test) or false (to release)
4. Monitor the workflow progress

See [.github/workflows/README.md](.github/workflows/README.md) for detailed workflow documentation.

## Manual Release Process

If you prefer to release manually or need more control, follow the steps below. Otherwise, skip to the Prerequisites section.

## Prerequisites

- Ensure all tests pass: `npm test`
- Verify build works: `npm run build`  
- Review and update documentation if needed
- Test the widget with demo files to ensure functionality

**Current Version**: `0.23.0` (Major refactor with component-based architecture)

## 1. Bump the version

Choose the type of release:
- **Patch (bug fix)**: `npm run release:patch`
- **Minor (new feature)**: `npm run release:minor`
- **Major (breaking change)**: `npm run release:major`

These scripts will:
1. Update the `version` in `package.json`.
2. Commit with message `chore: release vX.Y.Z`.
3. Create and push a Git tag `vX.Y.Z`.

> **Alternative (manual bump)**
> ```bash
> vim package.json        # update "version"
> git add package.json
> git commit -m "chore: bump version to X.Y.Z"
> git tag vX.Y.Z
> git push origin main --follow-tags
> ```

## 2. Build the widget

```bash
npm install
npm run build
```

This generates the production files in `dist/`. The build now includes:
- Component-based architecture files (ChatWidget, UIManager, ConversationManager, etc.)
- Optimized bundle size (~41KB gzipped, down from ~50KB)
- TypeScript declarations for all exported types

## 3. Generate the WordPress plugin bundle

```bash
node wp-bundle.js
```

This script will:
- Build a WP-specific UMD bundle using the refactored ChatWidget
- Copy `agentman-chat-widget.js` to `wordpress/assets/vendor/`
- Update the plugin header version in `wordpress/agentman-chat-widget.php`
- Create `agentman-chat-widget-X.Y.Z.zip` in the project root

**Note**: The script uses a temporary webpack config targeting the new ChatWidget class and component architecture. Verify this works with the refactored codebase.

## 4. Push changes & trigger CI/CD

```bash
git push origin main --follow-tags
```

Pushing tags triggers the GitHub Actions workflow:
- Creates a GitHub Release.
- Publishes to npm.
- Uploads the plugin zip and assets to the release.

## 5. Verify the release

- Check the [GitHub Releases](https://github.com/your-repo/agentman-chat-widget/releases) page
- Confirm npm version: `npm view @agentman/chat-widget version`
- Test the WordPress plugin zip installation and activation
- Verify demo files work with the new build:
  - `demo.html` - Basic configuration demo
  - `cdn-demo.html` - CDN integration test  
  - `unified-demo.html` - Advanced features test
  - `iframe-example.html` - Iframe integration test
  - `persistence-demo.html` - Conversation history test

## 6. Release Notes Template (v0.23.0+)

For major releases after v0.23.0, include these key changes:

### ✨ **Major Refactor (v0.23.0)**
- **Component Architecture**: Completely refactored to component-based architecture
- **Claude-Style UI**: Removed message bubbles, added role labels for cleaner conversations  
- **Simplified Theming**: Reduced theme parameters from ~16 to 9 essential options
- **Better Performance**: Improved bundle size (~41KB gzipped) with optimized architecture
- **Backward Compatibility**: Maintained API compatibility with proper migration guide

### 🎨 **UI/UX Improvements**
- Migrated to Tailwind Blue color scheme (#2563eb)
- Fixed icon alignment and hover effects consistency
- Improved header design with grouped action buttons
- Enhanced responsive behavior across devices

### 🔧 **Developer Experience**  
- Cleaner demo files (reduced from 21 to 6 essential demos)
- Updated documentation for new architecture
- Improved TypeScript definitions
- Better error handling and validation

### 📦 **Breaking Changes**
- Removed deprecated theme properties (see migration guide)
- Changed primary colors from emerald to blue theme
- Updated component file structure (backward compatible exports maintained)

## 🧪 Pre-Release Testing Checklist

Before releasing, verify these key integration points:

### WordPress Bundle Verification
```bash
# Test WordPress bundle generation
node wp-bundle.js

# Verify bundle exports ChatWidget correctly
head -n 5 wp-dist/agentman-chat-widget.js
# Should show UMD wrapper with ChatWidget export
```

### Demo File Testing
Open each demo in browser and verify:
- ✅ `demo.html` - Basic widget loads and functions
- ✅ `cdn-demo.html` - CDN integration works
- ✅ `unified-demo.html` - Advanced features function
- ✅ `iframe-example.html` - Iframe embedding works
- ✅ `persistence-demo.html` - Conversation history persists

### Build Verification
```bash
npm run build
# Check dist/index.js exists and is properly minified
# Verify TypeScript declarations in dist/ are generated
```

### Breaking Change Migration
For v0.23.0+, ensure users can migrate deprecated theme properties:
- `headerBackgroundColor` → removed (now white by default)
- `agentBackgroundColor` → removed (Claude-style layout)
- `userBackgroundColor` → removed (Claude-style layout)
- Other bubble-related properties → removed

## 🤖 Automated Release Workflows

### Available GitHub Actions

1. **Full Release Pipeline** (`full-release.yml`)
   - Releases NPM package and WordPress plugin
   - Handles version bumping, building, testing, and publishing
   - Creates GitHub releases with artifacts

2. **Shopify Widget Release** (`shopify-release.yml`)
   - Deploys Shopify widget to Google Cloud Storage CDN
   - Independent versioning from NPM package
   - Handles cache invalidation

3. **Release All Components** (`release-all.yml`)
   - Orchestrates releases across all components
   - Choose which components to release
   - Single entry point for all releases

### Workflow Features

- **Dry Run Mode**: Test the release process without publishing
- **Automatic Version Bumping**: Semantic versioning support
- **Build Verification**: Ensures builds succeed before publishing
- **Release Notes Generation**: Automatic changelog from commits
- **Deployment Verification**: Checks that packages are accessible
- **Artifact Management**: Handles WordPress plugin zips

### Required Secrets

Configure in GitHub repository settings:
- `NPM_TOKEN`: For publishing to npm
- `WIF_PROVIDER`: For Google Cloud authentication (Shopify)
- `WIF_SERVICE_ACCOUNT`: For GCP deployment (Shopify)

---
Keep this guide updated as your workflow evolves.
