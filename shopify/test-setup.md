# Local Testing Setup for Shopify Integration

## Step 1: Create Local Test Server

Create a simple local server to serve the widget script:

```bash
# Navigate to shopify directory
cd /path/to/chat-widget/shopify

# Create test server directory
mkdir -p test-server
cd test-server

# Create simple HTTP server script
cat > server.js << 'EOF'
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    
    // CORS headers for cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Route requests
    if (req.url === '/v1/widget.js') {
        // Serve the widget script
        const scriptPath = path.join(__dirname, '../script-service/index.js');
        fs.readFile(scriptPath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Script not found');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.end(data);
        });
    } else if (req.url.startsWith('/config-tool/')) {
        // Serve config tool files
        const filePath = path.join(__dirname, '../config-tool', req.url.replace('/config-tool/', ''));
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            
            const ext = path.extname(filePath);
            let contentType = 'text/plain';
            if (ext === '.html') contentType = 'text/html';
            else if (ext === '.css') contentType = 'text/css';
            else if (ext === '.js') contentType = 'application/javascript';
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(port, () => {
    console.log(`\n🚀 Test server running on http://localhost:${port}`);
    console.log(`📝 Widget script: http://localhost:${port}/v1/widget.js`);
    console.log(`🎨 Config tool: http://localhost:${port}/config-tool/index.html`);
    console.log(`\nPress Ctrl+C to stop\n`);
});
EOF

# Start the server
node server.js
```

## Step 2: Test Widget Script Locally

Create a test HTML file to verify the widget works:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shopify Widget Local Test</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 2rem; 
            background: #f5f5f5; 
        }
        .test-content {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .status { 
            padding: 1rem; 
            margin: 1rem 0; 
            border-radius: 4px; 
        }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
    </style>
</head>
<body>
    <div class="test-content">
        <h1>🧪 Shopify Widget Local Test</h1>
        
        <div id="test-status" class="status info">
            ⏳ Initializing widget test...
        </div>
        
        <h2>Test Environment</h2>
        <ul>
            <li><strong>Local Server</strong>: http://localhost:3000</li>
            <li><strong>Widget Script</strong>: http://localhost:3000/v1/widget.js</li>
            <li><strong>Agent Token</strong>: <span id="token-display">Loading...</span></li>
        </ul>
        
        <h2>Test Scenarios</h2>
        <div id="test-results">
            <div class="test-case">
                <h3>1. Script Loading</h3>
                <div id="script-test" class="status info">Testing...</div>
            </div>
            
            <div class="test-case">
                <h3>2. Widget Initialization</h3>
                <div id="init-test" class="status info">Waiting for script...</div>
            </div>
            
            <div class="test-case">
                <h3>3. UI Rendering</h3>
                <div id="ui-test" class="status info">Waiting for initialization...</div>
            </div>
        </div>
        
        <h2>Manual Tests</h2>
        <ol>
            <li>Check that the widget appears in the bottom-right corner</li>
            <li>Click the toggle button to open the chat</li>
            <li>Send a test message and verify response</li>
            <li>Test the quick prompt buttons</li>
            <li>Check mobile responsiveness (resize browser)</li>
        </ol>
    </div>

    <!-- Shopify Widget Script -->
    <script>
        // Test configuration
        const testConfig = {
            agentToken: 'demo-token-for-testing', // Replace with real token
            variant: 'corner',
            position: 'bottom-right',
            title: 'Test Assistant',
            theme: {
                buttonColor: '#2563eb'
            }
        };
        
        // Update UI with test info
        document.getElementById('token-display').textContent = testConfig.agentToken;
        
        // Test script loading
        const script = document.createElement('script');
        script.src = 'http://localhost:3000/v1/widget.js';
        script.setAttribute('data-agent-token', testConfig.agentToken);
        
        script.onload = function() {
            document.getElementById('script-test').className = 'status success';
            document.getElementById('script-test').textContent = '✅ Script loaded successfully';
            
            // Test widget initialization
            setTimeout(() => {
                if (window.agentmanWidget) {
                    document.getElementById('init-test').className = 'status success';
                    document.getElementById('init-test').textContent = '✅ Widget initialized successfully';
                    
                    // Test UI rendering
                    setTimeout(() => {
                        const container = document.getElementById('agentman-chat-shopify');
                        if (container && container.children.length > 0) {
                            document.getElementById('ui-test').className = 'status success';
                            document.getElementById('ui-test').textContent = '✅ UI rendered successfully';
                            
                            document.getElementById('test-status').className = 'status success';
                            document.getElementById('test-status').textContent = '🎉 All automated tests passed! Proceed with manual testing.';
                        } else {
                            document.getElementById('ui-test').className = 'status error';
                            document.getElementById('ui-test').textContent = '❌ UI not rendered - check console for errors';
                        }
                    }, 2000);
                } else {
                    document.getElementById('init-test').className = 'status error';
                    document.getElementById('init-test').textContent = '❌ Widget not initialized - check console for errors';
                }
            }, 1000);
        };
        
        script.onerror = function() {
            document.getElementById('script-test').className = 'status error';
            document.getElementById('script-test').textContent = '❌ Script failed to load - check server is running';
            
            document.getElementById('test-status').className = 'status error';
            document.getElementById('test-status').textContent = '❌ Test failed - script could not be loaded';
        };
        
        document.head.appendChild(script);
    </script>
</body>
</html>
```

Save this as `test-local.html` in the test-server directory.

## Step 3: Shopify Installation Test

Create a test script tag for Shopify (using local server):

```html
<!-- FOR TESTING ONLY - Use localhost -->
<script src="http://localhost:3000/v1/widget.js" 
        data-agent-token="YOUR_REAL_AGENT_TOKEN"></script>
```

**Note**: Replace `YOUR_REAL_AGENT_TOKEN` with an actual token from Agentman Studio.

## Step 4: Test Checklist

### Basic Functionality
- [ ] Widget appears in correct position
- [ ] Toggle button opens/closes chat
- [ ] Can send and receive messages
- [ ] Quick prompts work
- [ ] Styling looks correct

### Shopify Integration
- [ ] Customer data detection works
- [ ] Cart sync functions (add items to cart, check if AI can see them)
- [ ] Mobile responsiveness
- [ ] No conflicts with theme

### Error Handling
- [ ] Invalid token shows appropriate error
- [ ] Network issues handled gracefully
- [ ] Console shows no critical errors

## Step 5: Debug Common Issues

If tests fail, check:

1. **Console Errors**: Open browser DevTools (F12) → Console
2. **Network Issues**: Check Network tab for failed requests
3. **CORS Issues**: Make sure local server has CORS headers
4. **Token Issues**: Verify agent token is valid and active