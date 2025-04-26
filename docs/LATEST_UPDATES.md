# Latest Chat Widget Updates

This document highlights the most recent enhancements and improvements to the Agentman Chat Widget.

## Version 0.17.4 (April 2025)

### UI Improvements

- **Send Button Positioning**: Redesigned the chat input layout to ensure the send button:
  - Is right-aligned next to the text input
  - Remains vertically centered with the input
  - Has consistent alignment across all platforms (WordPress, demo page, etc.)
  - Uses flex layout for better responsiveness

### Persistence Enhancements

- **Smarter Initialization**: 
  - Only sends the `initialMessage` when starting a new conversation
  - Skips unnecessary API calls when restoring a persisted conversation
  - Properly handles conversation IDs across sessions
  - Improves cross-tab synchronization

### Branding

- Added "Powered by Agentman.ai" branding that:
  - Appears below the text input box on the left side
  - Uses subtle styling that doesn't interfere with user interactions
  - Cannot be overridden by configuration

### WordPress Plugin Improvements

- **Metadata Updates**:
  - WordPress version requirements (requires at least 5.6, tested up to 6.5)
  - PHP version requirement (requires PHP 7.2)
  - Updated Plugin URI to point directly to GitHub repository
  
- **Preview Functionality**:
  - Removed blank modal dialog
  - Activates widget directly in its natural position
  - Added "Stop Preview" button
  - Notification banner indicates when preview is active
  - Hides internal settings like API URL
  - Ensures all settings (including persistence) are passed to the widget

### Build & Release Process

The project now includes an automated release process using GitHub Actions:

1. **Version Management**:
   - Standardized versioning in package.json
   - WordPress plugin version synchronization
   - Automatic tag-based releases

2. **Asset Generation**:
   - Automatically builds WordPress plugin bundle
   - Attaches assets to GitHub releases
   - Publishes to npm registry

3. **Documentation**:
   - Added RELEASE_PROCESS.md with step-by-step instructions
   - Updated WordPress plugin documentation

## Debugging Common Issues

### WordPress Plugin Bundle

If the WordPress plugin bundle is missing from releases:
- Ensure package.json version matches the git tag
- Verify that tag is pushed after package.json is updated
- Check GitHub Actions logs for any errors in the build process

### Version Mismatches

If you encounter version mismatches:
1. Edit package.json to match the desired version
2. Commit and push the change 
3. Re-tag or delete/recreate the tag
4. Push using `git push --follow-tags`
