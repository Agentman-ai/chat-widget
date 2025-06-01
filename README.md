# Agentman Chat Widget

[![CI](https://github.com/Agentman-ai/chat-widget/actions/workflows/ci.yml/badge.svg)](https://github.com/Agentman-ai/chat-widget/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/%40agentman%2Fchat-widget.svg)](https://badge.fury.io/js/%40agentman%2Fchat-widget)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A customizable, open-source chat widget that can be easily integrated into any web application. The widget provides a modern, responsive interface for users to interact with Agentman AI agents.

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

- 🎨 Fully customizable UI with extensive theming options
- 💬 Message prompts and welcome messages
- 🔒 Secure token-based authentication
- 🌐 Easy integration with any web application
- 📱 Responsive design for all devices
- 💾 Built-in persistence for chat history across sessions
- ⚡ Lightweight and performant (~50KB gzipped)
- 🔌 WordPress plugin support
- 🌍 Cross-browser compatible (Chrome, Firefox, Safari, Edge)
- ♿ Accessibility-friendly
- 🔧 TypeScript support

## Demo

Try out the chat widget with our interactive demo:
- [Live Demo](https://agentman.ai/chat-widget-demo)
- [Configuration Playground](https://agentman.ai/chat-widget-playground)

To run the demo locally:
```bash
npm install
npm run build
# Open unified-demo.html in your browser
```

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
```html
<script src="https://unpkg.com/@agentman/chat-widget@latest/dist/index.js"></script>
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
  apiUrl: 'https://studio-api.agentman.ai', // Default value
  
  // Widget appearance
  variant: 'corner', // 'corner' | 'centered' | 'inline'
  position: 'bottom-right', // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  initialHeight: '600px',
  initialWidth: '400px',
  
  // Content and behavior
  title: 'Agentman Assistant',
  placeholder: 'Ask me anything...',
  toggleText: 'Ask Agentman',
  initiallyOpen: false,
  initialMessage: 'Hello! How can I help you today?',
  
  // Message prompts
  messagePrompts: {
    show: true,
    welcome_message: 'Welcome! How can I help you today?',
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
    headerBackgroundColor: '#10b981',
    headerTextColor: '#ffffff',
    // ... more theme options
  },
  
  // Persistence
  persistence: {
    enabled: true,
    days: 7
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
| `apiUrl` | `string` | No | `'https://studio-api.agentman.ai'` | The API endpoint URL |
| `containerId` | `string` | Yes | - | ID of the container element |
| `variant` | `'corner' \| 'centered' \| 'inline'` | No | `'corner'` | Widget placement style |
| `position` | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | No | `'bottom-right'` | Position for corner variant |
| `initialHeight` | `string` | No | `'600px'` | Initial height of the widget |
| `initialWidth` | `string` | No | `'400px'` | Initial width of the widget |
| `title` | `string` | No | `'Chat Assistant'` | Chat widget title |
| `placeholder` | `string` | No | `'Type your message...'` | Input field placeholder |
| `toggleText` | `string` | No | `'Ask Agentman'` | Text on toggle button (corner variant) |
| `initiallyOpen` | `boolean` | No | `false` | Whether to open chat on load |
| `initialMessage` | `string` | No | - | Initial bot message |

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

The theme object supports comprehensive styling options:

```javascript
const config = {
  theme: {
    // Main widget colors
    backgroundColor: '#ffffff',
    textColor: '#111827',
    
    // Header styling
    headerBackgroundColor: '#10b981',
    headerTextColor: '#ffffff',
    
    // Message bubbles
    agentBackgroundColor: '#f3f4f6',
    userBackgroundColor: '#10b981',
    agentForegroundColor: '#111827',
    userForegroundColor: '#ffffff',
    
    // Toggle button (corner variant)
    toggleBackgroundColor: '#10b981',
    toggleTextColor: '#ffffff',
    toggleIconColor: '#ffffff',
    
    // Icons
    agentIconColor: '#10b981',
    userIconColor: '#10b981',
    
    // Buttons
    buttonColor: '#10b981',
    buttonTextColor: '#ffffff'
  }
};
```

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
    enabled: true,     // Enable persistence
    days: 7,          // Days to keep messages
    key: 'my_custom_key'  // Optional custom storage key
  }
};
```

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `enabled` | `boolean` | No | `false` | Enable/disable persistence |
| `days` | `number` | No | `7` | Number of days to keep messages |
| `key` | `string` | No | `chatwidget_{containerId}_data` | Custom storage key |

Features:
- Saves messages to localStorage
- Maintains conversation IDs
- Syncs across browser tabs
- Automatic expiration of old conversations

### Branding

Control branding elements:

```javascript
const config = {
  hideBranding: false  // Show/hide "Powered by Agentman.ai" link
};
```

Note: The "Powered by Agentman.ai" text will always appear but the `hideBranding` option controls whether it's clickable.

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

Update widget configuration after initialization:

```javascript
const chatWidget = new ChatWidget(initialConfig);

// Update theme dynamically
chatWidget.updateTheme({
  headerBackgroundColor: '#059669'
});

// Change agent
chatWidget.updateAgent('NEW_AGENT_TOKEN');
```

### Event Handling

Listen to widget events:

```javascript
chatWidget.on('open', () => {
  console.log('Chat opened');
});

chatWidget.on('close', () => {
  console.log('Chat closed');
});

chatWidget.on('message', (message) => {
  console.log('New message:', message);
});
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
git clone https://github.com/agentman-ai/chat-widget.git
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

# Build with source maps
npm run build:debug

# Build WordPress plugin
npm run build:wordpress
```

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
├── src/              # Source code
│   ├── components/   # UI components
│   ├── styles/       # CSS styles
│   ├── utils/        # Utility functions
│   └── index.ts      # Main entry point
├── dist/             # Built files
├── wordpress-plugin/ # WordPress plugin
├── docs/             # Documentation
└── examples/         # Example implementations
```

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
