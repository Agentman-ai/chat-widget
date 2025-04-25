/**
 * WordPress Bundle Script for Agentman Chat Widget
 * 
 * This script bundles the ChatWidget for WordPress plugin integration.
 * It creates a UMD bundle that can be directly included in WordPress.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  sourceDir: path.resolve(__dirname),
  wpPluginDir: path.resolve(__dirname, './wordpress'),
  bundleFileName: 'agentman-chat-widget.js',
  version: require('./package.json').version,
};

console.log('🚀 Starting WordPress bundle process for Agentman Chat Widget');
console.log(`Version: ${CONFIG.version}`);

// Step 1: Build the widget with the standard build process
console.log('\n📦 Step 1: Building the widget...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 2: Create WordPress-specific webpack config
console.log('\n📝 Step 2: Creating WordPress-specific webpack config...');

const wpWebpackConfig = `
const path = require('path');

module.exports = {
  entry: './index.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.json'),
              transpileOnly: false
            }
          }
        ],
        exclude: /node_modules/,
      },
      {
        test: /\\.svg$/,
        type: 'asset/source'
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    modules: [
      path.resolve(__dirname),
      'node_modules'
    ]
  },
  output: {
    filename: '${CONFIG.bundleFileName}',
    path: path.resolve(__dirname, 'wp-dist'),
    library: {
      name: 'ChatWidget',
      type: 'umd',
      export: 'ChatWidget'
    },
    globalObject: 'typeof self !== "undefined" ? self : this',
    umdNamedDefine: true
  },
  optimization: {
    minimize: true
  }
};
`;

const wpWebpackConfigPath = path.join(CONFIG.sourceDir, 'webpack.wp.config.js');
fs.writeFileSync(wpWebpackConfigPath, wpWebpackConfig);
console.log('✅ WordPress webpack config created');

// Step 3: Create wp-dist directory if it doesn't exist
const wpDistDir = path.join(CONFIG.sourceDir, 'wp-dist');
if (!fs.existsSync(wpDistDir)) {
  fs.mkdirSync(wpDistDir);
}

// Step 4: Build WordPress-specific bundle
console.log('\n🔧 Step 3: Building WordPress-specific bundle...');
try {
  execSync('npx webpack --config webpack.wp.config.js', { stdio: 'inherit' });
  console.log('✅ WordPress bundle created successfully');
} catch (error) {
  console.error('❌ WordPress bundle build failed:', error.message);
  process.exit(1);
}

// Step 5: Copy the bundle to the WordPress plugin directory
console.log('\n📋 Step 4: Copying bundle to WordPress plugin...');

// Create vendor directory if it doesn't exist
const vendorDir = path.join(CONFIG.wpPluginDir, 'assets/vendor');
if (!fs.existsSync(vendorDir)) {
  fs.mkdirSync(vendorDir, { recursive: true });
}

// Copy the bundle
const sourcePath = path.join(wpDistDir, CONFIG.bundleFileName);
const destPath = path.join(vendorDir, CONFIG.bundleFileName);

try {
  fs.copyFileSync(sourcePath, destPath);
  console.log(`✅ Bundle copied to ${destPath}`);
} catch (error) {
  console.error(`❌ Failed to copy bundle: ${error.message}`);
  process.exit(1);
}

// Step 6: Update version in WordPress plugin
console.log('\n🔄 Step 5: Updating version in WordPress plugin...');

// Update version in main plugin file
const pluginFilePath = path.join(CONFIG.wpPluginDir, 'agentman-chat-widget.php');
try {
  let pluginFileContent = fs.readFileSync(pluginFilePath, 'utf8');
  
  // Update version in plugin header
  pluginFileContent = pluginFileContent.replace(
    /Version: \d+\.\d+\.\d+/,
    `Version: ${CONFIG.version}`
  );
  
  // Update version constant
  pluginFileContent = pluginFileContent.replace(
    /define\('AGENTMAN_CHAT_WIDGET_VERSION', '.*?'\);/,
    `define('AGENTMAN_CHAT_WIDGET_VERSION', '${CONFIG.version}');`
  );
  
  fs.writeFileSync(pluginFilePath, pluginFileContent);
  console.log('✅ Plugin version updated');
} catch (error) {
  console.error(`❌ Failed to update plugin version: ${error.message}`);
}

// Step 7: Create a zip file for distribution
console.log('\n📦 Step 6: Creating WordPress plugin zip file...');

const zipFileName = `agentman-chat-widget-${CONFIG.version}.zip`;
const zipFilePath = path.join(CONFIG.sourceDir, zipFileName);

try {
  // Remove existing zip file if it exists
  if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
  }
  
  // Create zip file
  execSync(`cd "${CONFIG.wpPluginDir}" && zip -r "${zipFilePath}" .`, { stdio: 'inherit' });
  console.log(`✅ Plugin zip created at ${zipFilePath}`);
} catch (error) {
  console.error(`❌ Failed to create zip file: ${error.message}`);
}

// Clean up
console.log('\n🧹 Step 7: Cleaning up...');
try {
  fs.unlinkSync(wpWebpackConfigPath);
  console.log('✅ Temporary webpack config removed');
} catch (error) {
  console.warn(`⚠️ Failed to remove temporary webpack config: ${error.message}`);
}

console.log('\n✨ WordPress bundle process completed successfully!');
console.log(`
Summary:
- Widget version: ${CONFIG.version}
- Bundle created: ${destPath}
- Plugin zip: ${zipFilePath}

To use this bundle:
1. Install the plugin in WordPress
2. Configure the widget in the WordPress admin
3. The chat widget will now use the built-in persistence functionality
`);
