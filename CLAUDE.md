# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Build and Development
- `npm run build` - Build for production using webpack and generate TypeScript declarations
- `npm run dev` - Start development server with webpack watch mode
- `npm run prepare` - Runs build automatically before npm install
- `npm run test` - Run Jest tests (currently configured to pass with no tests)
- `npm run lint` - Run ESLint on TypeScript files

### Release Management
- `npm run release:patch` - Bump patch version and create release
- `npm run release:minor` - Bump minor version and create release  
- `npm run release:major` - Bump major version and create release

### WordPress Plugin
- Build WordPress plugin using webpack to generate wp-bundle.js for the WordPress integration

## Architecture Overview

### Core Components
The chat widget is built as a TypeScript class-based system with several key architectural patterns:

**Main Widget Class (`ChatWidget.ts`)**
- Singleton pattern per container ID to prevent multiple instances
- Manages complete widget lifecycle (create, update, destroy)
- Handles three display variants: `corner`, `centered`, and `inline`
- Integrates with Agentman API for conversational AI

**Manager Pattern Architecture**
- `ConfigManager` - Handles configuration validation and defaults
- `StateManager` - Manages widget state with pub/sub pattern for reactive updates
- `StyleManager` - Dynamically injects and manages CSS styles
- `PersistenceManager` - Handles localStorage conversation history with automatic cleanup
- `FileUploadManager` - Manages file uploads with progress tracking and validation

**Message Processing Pipeline**
- `MessageRenderer` - Converts messages to HTML using marked.js for markdown
- `OfflineParser` - Fallback parser when CDN loading fails
- SVG processing with sanitization and color theming support

### Key Design Patterns

**State Management**
- Reactive state updates through StateManager subscription system
- Immutable state updates with automatic persistence
- Conversation switching with proper state isolation

**Theming System**
- CSS custom properties for dynamic theme updates
- Theme inheritance from config to runtime styling
- Icon color customization through CSS variables

**Offline Resilience**
- CDN fallback system for external dependencies (marked.js)
- Browser caching using Cache API
- Graceful degradation to offline parser

**File Attachment System**
- Agent capability detection for supported file types
- Progressive upload with real-time progress feedback
- Automatic file type validation and user feedback

### Build System
- **Webpack** with TypeScript compilation
- **UMD bundle** for both npm and CDN usage
- **Dual output**: ES modules + CommonJS for maximum compatibility
- **WordPress integration** through separate bundle generation

### Integration Patterns
- **Container-based**: Mounts to existing DOM elements via `containerId`
- **CDN-ready**: Can be loaded directly from unpkg/jsdelivr without build step
- **Framework agnostic**: Works with React, Vue, vanilla JS
- **WordPress plugin**: Dedicated PHP integration with admin interface

### API Integration
- **Agentman API**: RESTful communication with conversation management
- **Streaming support**: Real-time message delivery
- **File upload**: Multipart form data with progress tracking
- **Capability detection**: Dynamic feature enablement based on agent capabilities

## Development Notes

### File Structure
- `assistantWidget/` - Main widget implementation
- `assistantWidget/styles/` - CSS-in-JS styling system
- `assistantWidget/message-renderer/` - Message processing and rendering
- `assistantWidget/utils/` - Utility functions for icons, files, etc.
- `wordpress/` - WordPress plugin integration
- `dist/` - Built output for npm distribution

### Testing Strategy
- Currently configured for Jest but no tests implemented
- Demo files serve as integration tests: `demo.html`, `cdn-demo.html`, `unified-demo.html`
- WordPress plugin includes admin interface for testing configurations

### Performance Considerations
- Lazy loading of marked.js dependency with CDN fallback
- Debounced resize handling to prevent excessive redraws
- Efficient DOM updates through targeted element manipulation
- Conversation history pagination (not yet implemented)

### Browser Compatibility
- ES5 target for maximum compatibility
- Polyfill-free implementation using modern APIs with fallbacks
- Tested on Chrome, Firefox, Safari, Edge