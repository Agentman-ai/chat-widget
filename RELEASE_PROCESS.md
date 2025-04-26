# Release & Deployment Guide

This document outlines how to bump the version, build the widget, and deploy a new release of the Agentman Chat Widget.

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

This generates the production files in `dist/`.

## 3. Generate the WordPress plugin bundle

```bash
node wp-bundle.js
```

This script will:
- Build a WP-specific bundle.
- Copy `agentman-chat-widget.js` to `wordpress/assets/vendor/`.
- Update the plugin header version in `wordpress/agentman-chat-widget.php`.
- Create `agentman-chat-widget-X.Y.Z.zip` in the project root.

## 4. Push changes & trigger CI/CD

```bash
git push origin main --follow-tags
```

Pushing tags triggers the GitHub Actions workflow:
- Creates a GitHub Release.
- Publishes to npm.
- Uploads the plugin zip and assets to the release.

## 5. Verify the release

- Check the [GitHub Releases](https://github.com/your-repo/agentman-chat-widget/releases) page.
- Confirm npm version: `npm view @agentman/chat-widget version`.
- Install the plugin zip in WordPress to test.

---
Keep this guide updated as your workflow evolves.
