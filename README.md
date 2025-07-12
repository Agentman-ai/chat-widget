# Agentman Chat Widget

[![CI](https://github.com/Agentman-ai/chat-widget/actions/workflows/ci.yml/badge.svg)](https://github.com/Agentman-ai/chat-widget/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/%40agentman%2Fchat-widget.svg)](https://badge.fury.io/js/%40agentman%2Fchat-widget)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A customizable, open-source chat widget that can be easily integrated into any web application. The widget provides a modern, responsive interface for users to interact with Agentman AI agents.

**Latest Version**: Features a completely refactored component-based architecture with improved performance, simplified theming, and Claude-style conversation interface.

## Table of Contents
- [Features](#features)
- [Demo](#demo)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [JavaScript](#javascript)
  - [HTML](#html)
  - [React](#react)
  - [Vue](#vue)
- [Configuration](#configuration)
  - [Basic Configuration](#basic-configuration)
  - [Message Prompts](#message-prompts)
  - [Theme Customization](#theme-customization)
  - [Icon Customization](#icon-customization)
  - [Persistence](#persistence)
  - [Branding](#branding)
- [Advanced Usage](#advanced-usage)
  - [Multiple Instances](#multiple-instances)
  - [Dynamic Configuration](#dynamic-configuration)
  - [Event Handling](#event-handling)
- [WordPress Integration](#wordpress-integration)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Features

### 🎨 **Modern Interface**
- Claude-style conversation layout with role labels (no message bubbles)
- Simplified theming system focused on essential customization
- Responsive design for all devices and screen sizes
- Professional header design with grouped action buttons

### 🏗️ **Component Architecture**
- Modern component-based architecture for better maintainability
- Separated concerns: UIManager, ConversationManager, StateManager
- Reactive state management with pub/sub pattern
- Optimized DOM manipulation and caching

### 💬 **Conversation Features**
- Multiple conversation support with history navigation
- Message prompts and welcome messages
- Conversation persistence across sessions
- Real-time message rendering with markdown support

### 🔧 **Developer Experience**
- TypeScript support with comprehensive type definitions
- Easy integration with any web application
- WordPress plugin support with visual configuration
- Simplified API with backward compatibility

### ⚡ **Performance**
- Lightweight and performant (~41KB gzipped)
- Optimized bundle size with smart defaults
- Efficient memory management and cleanup
- Browser caching and CDN support

### 🔒 **Security & Reliability**
- Secure token-based authentication
- Input sanitization and XSS prevention
- Cross-browser compatible (Chrome, Firefox, Safari, Edge)
- Accessibility-friendly design

## Demo

Try out the chat widget with our interactive demos:
- [Live Demo](https://agentman.ai/chat-widget-demo)
- [Configuration Playground](https://agentman.ai/chat-widget-playground)
- [CDN Integration Demo](cdn-demo.html) - See how to use the widget from CDN without npm
- [Iframe Example](iframe-example.html) - Example of embedding the widget in an iframe

To run the demos locally:
```bash
npm install
npm run build
# Open any of the demo HTML files in your browser:
# - demo.html (main configuration demo)
# - unified-demo.html (advanced features)
# - cdn-demo.html (CDN integration)
# - iframe-example.html (iframe embedding)
# - persistence-demo.html (conversation history)
```

See [DEMOS.md](DEMOS.md) for detailed information about each demo.

## Installation

### NPM
```bash
npm install @agentman/chat-widget
```

### Yarn
```bash
yarn add @agentman/chat-widget
```

### CDN

You can load the chat widget directly from a CDN without any installation:

```html
<!-- unpkg (recommended) -->
<script src="https://unpkg.com/@agentman/chat-widget@latest/dist/index.js"></script>

<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/@agentman/chat-widget@latest/dist/index.js"></script>

<!-- Specific version (recommended for production) -->
<script src="https://unpkg.com/@agentman/chat-widget@0.23.0/dist/index.js"></script>
```

**Benefits of CDN usage:**
- No installation or build process required
- Perfect for embedding in iframes
- Automatic updates with `@latest` tag
- Global CDN with fast delivery
- Browser caching for better performance

**Iframe Integration Example:**
```html
<!-- parent-page.html -->
<iframe src="chat-iframe.html" width="100%" height="600"></iframe>

<!-- chat-iframe.html -->
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/@agentman/chat-widget@latest/dist/index.js"></script>
</head>
<body>
  <div id="chat-widget"></div>
  <script>
    // When using CDN, access ChatWidget from the global
    const ChatWidget = window['@agentman/chat-widget'].ChatWidget;
    
    const chatWidget = new ChatWidget({
      agentToken: 'YOUR_AGENT_TOKEN',
      containerId: 'chat-widget',
      variant: 'inline' // Best for iframes
    });
  </script>
</body>
</html>
```

## Quick Start

1. **Get your Agent Token** from [Agentman Dashboard](https://studio.agentman.ai)

2. **Add the widget to your page**:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/@agentman/chat-widget@latest/dist/index.js"></script>
</head>
<body>
  <div id="chat-widget"></div>
  <script>
    // When using CDN, access ChatWidget from the global
    const ChatWidget = window['@agentman/chat-widget'].ChatWidget;
    
    const chatWidget = new ChatWidget({
      agentToken: 'YOUR_AGENT_TOKEN',
      containerId: 'chat-widget'
    });
  </script>
</body>
</html>
```

## Usage

### JavaScript

```javascript
import { ChatWidget } from '@agentman/chat-widget';

const config = {
  // Required settings
  agentToken: 'YOUR_AGENT_TOKEN',
  containerId: 'chat-widget-container',
  
  // Optional: Override default API URL
  apiUrl: 'https://api.agentman.ai', // Default value
  
  // Widget appearance
  variant: 'corner', // 'corner' | 'centered' | 'inline'
  position: 'bottom-right', // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  initiallyOpen: false,
  initialHeight: '600px',
  initialWidth: '400px',
  
  // Content and behavior
  title: 'AI Assistant',
  placeholder: 'Type your message...',
  toggleText: 'Ask AI',
  initialMessage: 'Hello',
  enableAttachments: true,
  
  // Message prompts
  messagePrompts: {
    show: true,
    welcome_message: 'How can I help you today?',
    prompts: [
      'What can you do?',
      'Give me a tour',
      'Help me get started'
    ]
  },
  
  // Theme customization
  theme: {
    backgroundColor: '#ffffff',
    textColor: '#111827',
    buttonColor: '#2563eb',
    buttonTextColor: '#ffffff',
    agentForegroundColor: '#111827',
    userForegroundColor: '#2563eb',
    toggleBackgroundColor: '#2563eb',
    toggleTextColor: '#ffffff',
    toggleIconColor: '#ffffff'
  },
  
  // Persistence
  persistence: {
    enabled: true,
    storageKey: 'agentman_chat',
    maxConversations: 10,
    ttlDays: 7
  },
  
  // Assets (optional)
  logo: '<svg>...</svg>',
  headerLogo: '<svg>...</svg>',
  
  // Advanced (optional)
  clientMetadata: {
    userId: '123',
    customField: 'value'
  }
};

const chatWidget = new ChatWidget(config);

// Cleanup when needed
chatWidget.destroy();
```

### HTML

```html
<!-- Basic container -->
<div id="chat-widget-container"></div>

<!-- With custom styling -->
<div id="chat-widget-container" style="height: 100vh; width: 100%;"></div>
```

### React

```jsx
import { useEffect, useRef } from 'react';
import { ChatWidget } from '@agentman/chat-widget';

function ChatComponent({ agentToken }) {
  const widgetRef = useRef(null);

  useEffect(() => {
    widgetRef.current = new ChatWidget({
      agentToken,
      containerId: 'react-chat-widget'
    });

    return () => {
      widgetRef.current?.destroy();
    };
  }, [agentToken]);

  return <div id="react-chat-widget" />;
}
```

### Vue

```vue
<template>
  <div id="vue-chat-widget"></div>
</template>

<script>
import { ChatWidget } from '@agentman/chat-widget';

export default {
  props: ['agentToken'],
  mounted() {
    this.chatWidget = new ChatWidget({
      agentToken: this.agentToken,
      containerId: 'vue-chat-widget'
    });
  },
  beforeDestroy() {
    this.chatWidget?.destroy();
  }
};
</script>
```

## Configuration

### Basic Configuration

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `agentToken` | `string` | Yes | - | Your Agentman agent token |
| `containerId` | `string` | Yes | - | ID of the container element |
| `apiUrl` | `string` | No | `'https://api.agentman.ai'` | Custom API endpoint URL |
| `variant` | `'corner' \| 'centered' \| 'inline'` | No | `'corner'` | Widget placement style |
| `position` | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | No | `'bottom-right'` | Position for corner variant |
| `initiallyOpen` | `boolean` | No | `false` | Whether to open chat on load |
| `initialHeight` | `string` | No | `'600px'` | Initial height of the widget |
| `initialWidth` | `string` | No | `'400px'` | Initial width of the widget |
| `title` | `string` | No | `'AI Assistant'` | Chat widget title |
| `placeholder` | `string` | No | `'Type your message...'` | Input field placeholder |
| `toggleText` | `string` | No | `'Ask AI'` | Text on toggle button (corner variant) |
| `initialMessage` | `string` | No | `'Hello'` | Initial message sent to agent |
| `enableAttachments` | `boolean` | No | `true` | Enable file attachments |

### Message Prompts

Configure welcome messages and quick-action prompts that appear when users first interact with the widget:

```javascript
const config = {
  messagePrompts: {
    show: true, // Enable/disable prompts
    welcome_message: 'Welcome! How can I help you today?',
    prompts: [
      'What can you do?',
      'Give me a tour',
      'Help me get started'
    ]
  }
};
```

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `show` | `boolean` | No | `true` | Show/hide welcome message and prompts |
| `welcome_message` | `string` | No | `'Welcome! How can I help you today?'` | Welcome message text |
| `prompts` | `string[]` | No | `[]` | Array of prompt buttons (max 3) |

Prompts appear above the toggle button in corner variant and automatically send the message when clicked.

### Theme Customization

The theme object supports comprehensive styling options using a simplified, modern interface:

```javascript
const config = {
  theme: {
    // Core Colors
    textColor: '#111827',          // Main text color
    backgroundColor: '#ffffff',     // Widget background
    
    // Buttons
    buttonColor: '#2563eb',        // Primary button color
    buttonTextColor: '#ffffff',    // Button text color
    
    // Message Colors (Claude-style, no bubbles)
    agentForegroundColor: '#111827',  // Assistant text color
    userForegroundColor: '#2563eb',   // User text color
    
    // Toggle Button (corner variant)
    toggleBackgroundColor: '#2563eb', // Toggle button background
    toggleTextColor: '#ffffff',       // Toggle button text
    toggleIconColor: '#ffffff'        // Toggle button icon
  }
};
```

**Theme Simplification**: The new ChatWidget uses a streamlined theme system focused on essential customization options. Message bubbles have been replaced with a Claude-style conversation layout using role labels.

### Icon Customization

Customize user and agent avatars:

```javascript
const config = {
  icons: {
    userIcon: 'https://example.com/user-avatar.png',  // Image URL
    agentIcon: '<svg>...</svg>'  // SVG string
  },
  
  // Optional: Logo customization
  logo: 'https://example.com/logo.png',
  headerLogo: 'https://example.com/header-logo-32x32.png'
};
```

Icons can be:
- Image URLs (PNG, JPG, WebP)
- SVG strings (with color customization via theme)
- Base64 encoded images

### Persistence

Enable conversation history across page reloads:

```javascript
const config = {
  persistence: {
    enabled: true,           // Enable persistence
    storageKey: 'agentman_chat',  // Storage key prefix
    maxConversations: 10,    // Maximum stored conversations
    ttlDays: 7              // Days to keep conversations
  }
};
```

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `enabled` | `boolean` | No | `true` | Enable/disable persistence |
| `storageKey` | `string` | No | `'agentman_chat'` | LocalStorage key prefix |
| `maxConversations` | `number` | No | `10` | Maximum conversations to store |
| `ttlDays` | `number` | No | `7` | Days before conversation cleanup |

Features:
- Saves messages to localStorage
- Maintains conversation IDs
- Syncs across browser tabs
- Automatic expiration of old conversations

### Branding

The widget displays "Powered by Agentman.ai" with a link to the Agentman website. This branding helps users identify the AI technology powering the chat experience.

## Advanced Usage

### Multiple Instances

You can have multiple chat widgets on the same page:

```javascript
const widget1 = new ChatWidget({
  agentToken: 'TOKEN_1',
  containerId: 'chat-1'
});

const widget2 = new ChatWidget({
  agentToken: 'TOKEN_2',
  containerId: 'chat-2'
});
```

### Dynamic Configuration

The ChatWidget uses a modern component-based architecture with the following public methods:

```javascript
const chatWidget = new ChatWidget(initialConfig);

// Toggle chat visibility (corner variant)
chatWidget.toggleChat();

// Add messages programmatically
chatWidget.addMessage({
  id: 'msg-123',
  sender: 'agent',
  content: 'Hello from the API!',
  timestamp: new Date().toISOString(),
  type: 'text'
});

// Clear conversation storage
chatWidget.clearStorage();

// Clean up when done
chatWidget.destroy();
```

### Static Methods

Access widget instances and manage multiple widgets:

```javascript
// Get widget instance by container ID
const widget = ChatWidget.getInstance('my-container');

// Destroy all widget instances
ChatWidget.destroyAll();
```

## WordPress Integration

The chat widget includes a WordPress plugin for easy integration.

### Installation

1. Download the plugin from [WordPress Plugin Directory](https://wordpress.org/plugins/agentman-chat-widget/) or build from source
2. Upload to your WordPress site
3. Activate the plugin
4. Configure in Settings > Agentman Chat

### Building from Source

```bash
# Build WordPress plugin
npm run build:wordpress

# This creates:
# - wordpress-plugin/agentman-chat-widget.zip
```

### Features

- Visual configuration interface
- Preview functionality
- Shortcode support: `[agentman_chat]`
- Widget area support
- Multisite compatible

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/Agentman-ai/chat-widget.git
cd chat-widget

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building

```bash
# Build for production
npm run build

# Build WordPress plugin
node wp-bundle.js
```

### Releasing

We use GitHub Actions for automated releases. See the [Release Process Guide](RELEASE_PROCESS.md) for details.

```bash
# Quick release using GitHub Actions
# 1. Go to Actions tab in GitHub
# 2. Run "Release All Components" workflow
# 3. Select release type and options
```

For manual releases or more details, see:
- [Release Process Guide](RELEASE_PROCESS.md)
- [GitHub Actions Documentation](.github/workflows/README.md)
- [GCP Deployment Setup](docs/gcp-deployment-setup.md)
- [Shopify Deployment Guide](shopify/docs/deployment-guide.md)

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

### Project Structure

```
chat-widget/
├── assistantWidget/        # Main widget source code
│   ├── components/         # UI component classes (UIManager, ConversationManager)
│   ├── styles/            # CSS-in-JS styling system
│   ├── message-renderer/  # Message processing and rendering
│   ├── utils/             # Utility functions and validation
│   ├── assets/            # Icons and logo assets
│   ├── types/             # TypeScript type definitions
│   ├── constants.ts       # Application constants
│   └── ChatWidget.ts      # Main ChatWidget class
├── dist/                  # Built files
├── wordpress/             # WordPress plugin integration
├── *.html                 # Demo files (see DEMOS.md)
└── index.ts              # Library entry point
```

### Architecture

The ChatWidget uses a modern component-based architecture:

- **ChatWidget**: Main coordinator class managing all functionality
- **UIManager**: Handles DOM creation, manipulation, and UI updates  
- **ConversationManager**: Manages multiple conversations and history
- **StateManager**: Reactive state management with pub/sub pattern
- **StyleManager**: Dynamic CSS injection and theming
- **MessageRenderer**: Markdown processing and message rendering
- **PersistenceManager**: localStorage conversation history management

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Reporting Issues

- Use the [issue tracker](https://github.com/agentman-ai/chat-widget/issues)
- Include browser version and OS
- Provide reproduction steps
- Include error messages and screenshots

### Pull Requests

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.
