#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read package.json to get version
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;
const majorVersion = version.split('.')[0];

console.log(`📦 Preparing CDN distribution for version ${version}`);

// Create CDN directory structure
const cdnRoot = path.join(__dirname, '..', 'cdn-dist');
const v1Dir = path.join(cdnRoot, 'v1');
const v2Dir = path.join(cdnRoot, 'v2');
const latestDir = path.join(cdnRoot, 'latest');
const versionedDir = path.join(cdnRoot, version);

// Clean and create directories
[cdnRoot, v1Dir, v2Dir, latestDir, versionedDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Files to copy
const filesToCopy = [
  { src: 'dist/index.js', dest: 'chat-widget.js' },
  { src: 'dist/index.js', dest: 'chat-widget.min.js' }, // Already minified by webpack
  { src: 'README.md', dest: 'README.md' }
];

// Copy files to each directory
function copyFiles(targetDir, version) {
  filesToCopy.forEach(({ src, dest }) => {
    const srcPath = path.join(__dirname, '..', src);
    const destPath = path.join(targetDir, dest);
    
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✓ Copied ${src} to ${targetDir}/${dest}`);
    }
  });
  
  // Create version.json
  const versionInfo = {
    version: version,
    buildDate: new Date().toISOString(),
    majorVersion: majorVersion,
    changelog: `https://github.com/Agentman-ai/chat-widget/releases/tag/v${version}`
  };
  
  fs.writeFileSync(
    path.join(targetDir, 'version.json'),
    JSON.stringify(versionInfo, null, 2)
  );
}

// Copy to versioned directory
console.log(`\n📁 Creating versioned distribution: ${version}`);
copyFiles(versionedDir, version);

// Copy to latest
console.log(`\n📁 Updating latest distribution`);
copyFiles(latestDir, version);

// Copy to v1 or v2 based on major version
if (majorVersion === '1') {
  console.log(`\n📁 Updating v2 distribution (new architecture)`);
  copyFiles(v2Dir, version);
} else if (majorVersion === '0') {
  console.log(`\n📁 Updating v1 distribution (legacy)`);
  copyFiles(v1Dir, version);
}

// Create index.html for CDN with usage examples
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agentman Chat Widget CDN</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2 { color: #2563eb; }
        pre {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        code {
            background: #f0f0f0;
            padding: 2px 5px;
            border-radius: 3px;
        }
        .version-badge {
            background: #2563eb;
            color: white;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 14px;
            display: inline-block;
            margin-left: 10px;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>Agentman Chat Widget CDN <span class="version-badge">v${version}</span></h1>
    
    <h2>Available Versions</h2>
    <ul>
        <li><code>/latest/</code> - Latest stable version (currently ${version})</li>
        <li><code>/v1/</code> - Legacy architecture (0.x versions)</li>
        <li><code>/v2/</code> - New architecture with welcome screen (1.x versions)</li>
        <li><code>/${version}/</code> - Specific version</li>
    </ul>

    <h2>Usage</h2>
    
    <h3>Latest Version (Recommended)</h3>
    <pre><code>&lt;script src="https://cdn.agentman.ai/chat-widget/latest/chat-widget.min.js"&gt;&lt;/script&gt;
&lt;script&gt;
  const widget = new ChatWidget({
    containerId: 'chat-widget-container',
    apiUrl: 'https://api.agentman.ai/api',
    agentToken: 'YOUR_AGENT_TOKEN',
    // New v2 features
    showWelcomeScreen: true,
    floatingPromptsEnabled: true,
    enableAttachments: true
  });
&lt;/script&gt;</code></pre>

    <h3>Specific Version (Production)</h3>
    <pre><code>&lt;script src="https://cdn.agentman.ai/chat-widget/${version}/chat-widget.min.js"&gt;&lt;/script&gt;</code></pre>

    <h3>Legacy Version (v1)</h3>
    <pre><code>&lt;script src="https://cdn.agentman.ai/chat-widget/v1/chat-widget.min.js"&gt;&lt;/script&gt;</code></pre>

    <div class="warning">
        <strong>⚠️ Breaking Changes in v2:</strong><br>
        Version 1.0.0 introduces a new architecture with welcome screen. If upgrading from 0.x, please review the 
        <a href="https://github.com/Agentman-ai/chat-widget/blob/main/MIGRATION.md">migration guide</a>.
    </div>

    <h2>Features in v${version}</h2>
    <ul>
        <li>✨ Welcome screen with centered input interface</li>
        <li>🎈 Floating prompts when widget is closed</li>
        <li>💬 Direct conversation restore on widget click</li>
        <li>📎 File attachments enabled by default</li>
        <li>🔄 Improved state management with ViewManager</li>
        <li>🎨 Enhanced theming system</li>
    </ul>

    <h2>Documentation</h2>
    <p>Full documentation available at <a href="https://github.com/Agentman-ai/chat-widget">GitHub</a></p>
</body>
</html>`;

fs.writeFileSync(path.join(cdnRoot, 'index.html'), indexHtml);

console.log(`\n✅ CDN distribution prepared successfully!`);
console.log(`\n📋 Upload instructions:`);
console.log(`  1. Upload the contents of ./cdn-dist/ to your CDN`);
console.log(`  2. Ensure proper CORS headers are set`);
console.log(`  3. Set cache headers:`);
console.log(`     - Versioned paths (/${version}/): Cache-Control: public, max-age=31536000`);
console.log(`     - Latest/v1/v2 paths: Cache-Control: public, max-age=3600`);
console.log(`\n🚀 CDN URLs will be:`);
console.log(`  - https://cdn.agentman.ai/chat-widget/latest/chat-widget.min.js`);
console.log(`  - https://cdn.agentman.ai/chat-widget/v2/chat-widget.min.js`);
console.log(`  - https://cdn.agentman.ai/chat-widget/${version}/chat-widget.min.js`);