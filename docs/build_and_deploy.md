# Build and Deploy: Agentman Chat Widget

This guide walks you through the process of versioning, tagging, building, and deploying the Agentman Chat Widget—ensuring your release is correctly published to both npm and GitHub Releases (including the WordPress plugin bundle).

## Prerequisites
- You have push access to the repository
- You have a valid NPM_TOKEN secret set in GitHub Actions
- Your local git working directory is clean (no uncommitted changes)

---

## 1. Bump the Version in `package.json`
Edit the `version` field in `package.json` to the new release version (e.g., `0.17.5`). This version must match the git tag you will create.

Example:
```json
{
  "name": "@agentman/chat-widget",
  "version": "0.17.5",
  ...
}
```

---

## 2. Commit the Change
Stage and commit your changes:
```bash
git add package.json
# (also add any other files you changed)
git commit -m "chore: bump version to 0.17.5"
```

---

## 3. Create a Git Tag
Tag the commit with the same version, prefixed by `v`:
```bash
git tag v0.17.5
```

---

## 4. Push Commit and Tag
Push your commit(s) and the tag to GitHub:
```bash
git push
# Then push the tag
git push origin v0.17.5
```
Or, to push both at once:
```bash
git push --follow-tags
```

---

## 5. GitHub Actions: Build & Release
Once the tag is pushed, GitHub Actions will:
- Build the project
- Update WordPress plugin metadata to match the version
- Generate the WordPress plugin ZIP bundle
- Attach the ZIP to the GitHub Release for the tag
- Attempt to publish to npm (skipping if the version already exists)

---

## 6. Verify the Release
- Go to the [GitHub Releases page](https://github.com/Agentman-ai/chat-widget/releases)
- Download the `agentman-chat-widget-x.y.z.zip` asset for WordPress
- Check npm for the new version: `npm info @agentman/chat-widget`

---

## Troubleshooting

### Tag/Version Mismatch
- If the ZIP is missing or the workflow fails, check that `package.json` version and the git tag match exactly.
- If you need to redo a release:
  1. Delete the tag locally and remotely:
     ```bash
     git tag -d v0.17.5
     git push --delete origin v0.17.5
     ```
  2. Bump `package.json` if needed, commit, re-tag, and push again.

### NPM Publish Fails (403)
- This means the version already exists on npm. Bump the version in `package.json` and repeat the steps above.

---

## Summary Checklist
- [ ] Update `package.json` version
- [ ] Commit changes
- [ ] Tag the commit (vX.Y.Z)
- [ ] Push commit and tag
- [ ] Wait for GitHub Actions to finish
- [ ] Download assets from the release page

---

For more details, see `RELEASE_PROCESS.md` and `LATEST_UPDATES.md` in the `docs/` directory.
