# Agentman Chat Widget

[![CI](https://github.com/Agentman-ai/chat-widget/actions/workflows/ci.yml/badge.svg)](https://github.com/Agentman-ai/chat-widget/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/%40agentman%2Fchat-widget.svg)](https://badge.fury.io/js/%40agentman%2Fchat-widget)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A customizable chat widget that can be easily integrated into any web application. The widget provides a modern, responsive interface for users to interact with Agentman AI.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [JavaScript](#javascript)
  - [HTML](#html)
- [Configuration](#configuration)
- [Theme Customization](#theme-customization)
- [Icon Customization](#icon-customization)
- [Persistence](#persistence)
- [WordPress Integration](#wordpress-integration)
- [License](#license)

## Features

- 🎨 Fully customizable UI and icons
- 🔒 Secure token-based authentication
- 🌐 Easy integration with any web application
- 📱 Responsive design for all devices
- 💾 Built-in persistence for chat history
- ⚡ Lightweight and performant
- 🔌 WordPress plugin support

## Installation

```bash
npm install @agentman/chat-widget
```

## Usage

### JavaScript

```javascript
import { ChatWidget } from '@agentman/chat-widget';

const config = {
  // Required settings
  agentToken: 'YOUR_AGENT_TOKEN',
  apiUrl: 'https://run.agentman.ai',
  containerId: 'chat-widget-container',
  
  // Widget appearance
  variant: 'corner', // 'corner' | 'centered' | 'inline'
  initialHeight: '600px', // Initial height of the widget
  initialWidth: '400px',  // Initial width of the widget
  
  // Content and behavior
  title: 'Agentman Assistant',
  placeholder: 'Ask me anything...',
  toggleText: 'Ask Agentman', // Text shown on the toggle button (corner variant)
  initiallyOpen: false,
  initialMessage: 'Hello! How can I help you today?',
  
  // Theme customization
  theme: {
    backgroundColor: '#ffffff',    // Main background color
    textColor: '#111827',         // Main text color
    agentBackgroundColor: '#f3f4f6',  // Agent message background
    userBackgroundColor: '#10b981',   // User message background
    agentForegroundColor: '#000000',  // Agent message text
    userForegroundColor: '#ffffff',   // User message text
    headerBackgroundColor: '#059669',  // Header background
    headerTextColor: '#ffffff',       // Header text
    agentIconColor: '#059669',        // Agent icon color (for SVG)
    userIconColor: '#059669'          // User icon color (for SVG)
  },
  
  // Icons and assets
  icons: {
    userIcon: 'https://example.com/user-icon.png',  // User avatar (URL or SVG)
    agentIcon: '<svg>...</svg>'     // Agent avatar (URL or SVG)
  },
  
  // Logos
  logo: 'https://example.com/logo.png',  // Main logo
  headerLogo: 'https://example.com/header-logo-32x32.png', // Header logo (32x32px)
  
  // Persistence configuration
  persistence: {
    enabled: true,           // Enable/disable persistence
    days: 7,                // Number of days to keep messages
    key: 'custom_storage_key' // Optional custom storage key
  }
};

const chatWidget = new ChatWidget(config);

// Cleanup when needed
chatWidget.destroy();
```

### HTML

```html
<div id="chat-widget-container"></div>
```

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `agentToken` | `string` | Yes | Your Agentman API token |
| `apiUrl` | `string` | Yes | The API endpoint URL |
| `containerId` | `string` | Yes | ID of the container element |
| `variant` | `'corner' \| 'centered' \| 'inline'` | No | Widget placement style. Default: 'corner' |
| `initialHeight` | `string` | No | Initial height of the widget. Example: '600px' |
| `initialWidth` | `string` | No | Initial width of the widget. Example: '400px' |
| `title` | `string` | No | Chat widget title. Default: 'Chat Assistant' |
| `placeholder` | `string` | No | Custom placeholder text for input field. Default: 'Type your message...' |
| `toggleText` | `string` | No | Text shown on toggle button (corner variant). Default: 'Ask Agentman' |
| `initiallyOpen` | `boolean` | No | Whether to open chat on load. Default: false |
| `initialMessage` | `string` | No | Initial bot message |
| `theme` | `object` | No | UI theme customization (see Theme Customization) |
| `icons` | `object` | No | Icon customization (see Icon Customization) |
| `logo` | `string` | No | URL for the main logo |
| `headerLogo` | `string` | No | URL for the header logo (32x32px) |
| `persistence` | `object` | No | Persistence configuration (see Persistence) |

## Theme Customization

The theme object supports the following properties:

```typescript
interface ChatTheme {
  backgroundColor: string;    // Main background color
  textColor: string;         // Main text color
  agentBackgroundColor: string;  // Agent message background
  userBackgroundColor: string;   // User message background
  agentForegroundColor: string;  // Agent message text
  userForegroundColor: string;   // User message text
  headerBackgroundColor: string; // Header background
  headerTextColor: string;       // Header text
  agentIconColor: string;        // Agent icon color (for SVG icons)
  userIconColor: string;         // User icon color (for SVG icons)
}
```

## Icon Customization

The chat widget supports customization of user and agent avatars through the `icons` configuration option:

```typescript
interface ChatIcons {
  userIcon?: string;     // User avatar icon
  agentIcon?: string;    // Agent avatar icon
}
```

Each avatar icon can be specified as either:
- A URL to an image file (PNG, JPG, etc.)
- An SVG string
- The color of SVG icons can be customized using `userIconColor` and `agentIconColor` in the theme when using SVG

## Persistence

The chat widget includes built-in persistence functionality to save conversation history across page reloads:

```javascript
const config = {
  // ... other options
  
  // Persistence configuration
  persistence: {
    enabled: true,           // Enable/disable persistence
    days: 7,                // Number of days to keep messages
    key: 'custom_storage_key' // Optional custom storage key
  }
};
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `enabled` | `boolean` | No | Enable/disable persistence. Default: `false` |
| `days` | `number` | No | Number of days to keep messages. Default: `7` |
| `key` | `string` | No | Custom storage key. Default: `chatwidget_{containerId}_data` |

The persistence functionality:
- Saves messages to localStorage
- Restores conversation history on page reload
- Maintains conversation IDs across sessions
- Automatically expires old conversations

## WordPress Integration

The chat widget can be easily integrated into WordPress sites using our dedicated plugin.

### Bundling for WordPress

To create a WordPress-compatible bundle of the chat widget:

```bash
# Run the WordPress bundling script
node wp-bundle.js
```

This script:
1. Builds the chat widget with all dependencies
2. Creates a WordPress-specific bundle
3. Copies the bundle to the WordPress plugin directory
4. Updates version information in the plugin
5. Creates a distributable zip file

### WordPress Plugin Features

- Easy installation and configuration through WordPress admin
- Full integration with the chat widget's built-in persistence
- Customizable appearance and behavior
- Admin-only error messages and debugging
- Compatible with all WordPress themes

## License

MIT License
