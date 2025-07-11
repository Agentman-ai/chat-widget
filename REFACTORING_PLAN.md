# ChatWidget Refactoring Plan

## Current State
ChatWidget.ts has grown to over 2100 lines and handles too many responsibilities. This violates the Single Responsibility Principle and makes the code harder to maintain.

## Proposed Architecture

### 1. **MessageHandler** (New Component)
Extract all message-related functionality:
- `handleSendMessage()`
- `sendMessage()`
- `handleResponse()`
- `handleInitialResponse()`
- `addErrorMessage()`
- `isValidMessage()`
- `showLoadingIndicator()`
- `hideLoadingIndicator()`
- Message validation and processing

### 2. **AttachmentHandler** (New Component)
Extract all file attachment functionality:
- `handleAttachmentClick()`
- `handleFileSelect()`
- `handleAttachmentRemove()`
- `updateAttachmentPreview()`
- `renderMessageAttachments()`
- `getFileType()`
- `getAttachmentIcon()`
- `formatFileSize()`
- File type detection and validation
- Integration with FileUploadManager

### 3. **ConversationHandler** (New Component)
Extract conversation management logic:
- `handleNewConversation()`
- `handleSwitchConversation()`
- `handleDeleteConversation()`
- `handleToggleListView()`
- `updateConversationList()`
- `updateConversationHeaderButtons()`
- `clearMessagesUI()`
- Integration with ConversationManager

### 4. **APIClient** (New Component)
Extract all API communication:
- `initializeChat()`
- `sendMessage()` API calls
- `fetchAgentCapabilities()`
- Response processing
- Error handling for API calls
- Request/response formatting

### 5. **InitializationManager** (New Component)
Extract initialization logic:
- `initializeUI()`
- `initializeMarkdownProcessing()`
- `initializeClientMetadata()`
- `collectIPAddressAsync()`
- `mergeIPMetadata()`
- `restoreOrInitializeConversation()`
- `restoreMessages()`
- `finalizeInitialization()`

### 6. **ThemeManager** (New Component)
Extract theme-related functionality:
- `initializeTheme()`
- `initializeAssets()`
- Theme configuration
- Asset management
- Dynamic theme updates

### 7. **TelemetryManager** (New Component)
Extract telemetry and analytics:
- `trackTelemetryEvent()`
- Event formatting
- Storage of telemetry data
- Integration with external analytics

### 8. **PersistenceCoordinator** (Enhancement)
Enhance to handle:
- `setupUnloadHandler()`
- `debouncedSave()`
- `handlePersistenceError()`
- `showQuotaWarning()`
- Coordination between persistence and UI

## Refactoring Strategy

### Phase 1: Create Handler Classes
1. Create MessageHandler class
2. Create AttachmentHandler class
3. Create ConversationHandler class
4. Create APIClient class

### Phase 2: Move Functionality
1. Move methods to appropriate handlers
2. Update ChatWidget to delegate to handlers
3. Ensure all tests still pass

### Phase 3: Clean Up
1. Remove moved methods from ChatWidget
2. Update imports and dependencies
3. Update documentation

## Benefits
- **Smaller, focused classes** (~200-400 lines each)
- **Better testability** - each handler can be tested independently
- **Easier maintenance** - changes are isolated to specific handlers
- **Better separation of concerns**
- **Easier to add new features** without growing ChatWidget

## Implementation Priority
1. **MessageHandler** - Core functionality, high impact
2. **APIClient** - Clean separation of API concerns
3. **AttachmentHandler** - Self-contained functionality
4. **ConversationHandler** - UI-specific logic
5. **Others** - Lower priority, can be done incrementally