# Release Process

This document describes the streamlined release process for the Agentman Chat Widget.

## Quick Release (Recommended)

Use the automated release script for local releases:

```bash
# Patch release (2.5.0 → 2.5.1)
npm run release:patch

# Minor release (2.5.0 → 2.6.0)
npm run release:minor

# Major release (2.5.0 → 3.0.0)
npm run release:major
```

**What the script does:**
1. ✅ Pulls latest changes from `origin/main`
2. ✅ Bumps version in `package.json` and `package-lock.json`
3. ✅ Builds the project
4. ✅ Commits changes with standardized message
5. ✅ Creates git tag
6. ⏸️ Stops before pushing (you review first)

**After the script completes:**
```bash
# Review the changes
git show HEAD

# Push to remote (with tags)
git push origin main --follow-tags
```

**To undo (before pushing):**
```bash
git reset --hard HEAD~1
git tag -d v2.5.1  # Replace with actual version
```

## Manual Release

If you prefer manual control:

```bash
# 1. Pull latest changes
git pull --rebase origin main

# 2. Bump version manually
npm version patch  # or minor, or major

# 3. Push with tags
git push origin main --follow-tags
```

## GitHub Actions Release

For releases that include WordPress and Shopify deployment:

1. Go to [Actions](https://github.com/Agentman-ai/chat-widget/actions)
2. Select "Release All Components" workflow
3. Click "Run workflow"
4. Choose:
   - **Release type**: patch, minor, or major
   - **Components**: all, npm-only, wordpress-only, etc.
   - **Deploy Shopify to GCP**: true/false
5. Click "Run workflow"

**⚠️ Important:** After GitHub Actions completes:
```bash
# Pull the automated commits from GitHub
git pull --rebase origin main
```

GitHub Actions will:
- Bump version
- Build all components
- Create git commits and tags
- Publish to npm (if enabled)
- Build WordPress plugin zip
- Deploy Shopify to GCP (if enabled)
- Create GitHub release with notes

## Version Strategy

The project uses **independent versioning**:

| Component | Current Version | Purpose |
|-----------|----------------|---------|
| **Core Library** | 2.5.0 | npm package `@agentman/chat-widget` |
| **Shopify Integration** | 5.15.0 | CDN-hosted Shopify script |
| **WordPress Plugin** | 5.13.0 | WordPress plugin package |

**Core Library versioning:**
- Uses semantic versioning (semver)
- Bumped via `release.sh` or GitHub Actions
- Published to npm

**Shopify/WordPress versioning:**
- Independent from core library
- Manually bumped when those integrations change
- Updated in respective files

## Troubleshooting

### "You have uncommitted changes"
```bash
# Stash your changes
git stash

# Run release
npm run release:patch

# Restore changes
git stash pop
```

### "Failed to pull from origin"
```bash
# Check what's different
git fetch origin
git log main..origin/main

# Rebase manually
git pull --rebase origin main
```

### Version conflicts after GitHub Actions
This happens when both local and GitHub Actions bump the version:

```bash
# Always pull after GitHub Actions runs
git pull --rebase origin main

# If you have local commits, they'll be rebased on top
# Resolve any conflicts and continue
```

## Best Practices

1. **Always pull before releasing**
   ```bash
   git pull --rebase origin main
   ```

2. **Use the release script for consistency**
   ```bash
   npm run release:patch
   ```

3. **Review before pushing**
   ```bash
   git show HEAD
   git log --oneline -3
   ```

4. **Push with tags**
   ```bash
   git push origin main --follow-tags
   ```

5. **After GitHub Actions, always pull**
   ```bash
   # GitHub Actions makes commits too
   git pull --rebase origin main
   ```

## Release Checklist

- [ ] All tests passing locally (`npm test`)
- [ ] Code is linted (`npm run lint`)
- [ ] Changes documented in commit messages
- [ ] Pull latest from `origin/main`
- [ ] Run release script
- [ ] Review commit and tag
- [ ] Push to remote with tags
- [ ] Verify npm package published (for npm releases)
- [ ] Test CDN version works
- [ ] Update changelog if needed

## Related Files

- `release.sh` - Automated release script
- `.github/workflows/full-release.yml` - GitHub Actions release workflow
- `.github/workflows/release-all.yml` - Combined release workflow
- `package.json` - npm scripts and version
- `shopify/script-service/index.js` - Shopify version
- `wordpress/agentman-chat-widget.php` - WordPress version
