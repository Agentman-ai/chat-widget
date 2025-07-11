# ChatWidget Refactoring Guide

## How to integrate the new handlers into ChatWidget

### 1. Update imports in ChatWidget.ts

```typescript
// Add to imports
import { MessageHandler, APIClient, AttachmentHandler } from './handlers';
```

### 2. Add handlers as private properties

```typescript
private messageHandler: MessageHandler;
private apiClient: APIClient;
private attachmentHandler: AttachmentHandler;
```

### 3. Initialize handlers in initializeManagers()

```typescript
private initializeManagers(): void {
  // Existing managers...
  
  // Initialize API Client
  this.apiClient = new APIClient({
    apiUrl: this.config.apiUrl,
    websiteName: this.config.websiteName,
    debug: this.config.debug
  });
  
  // Initialize Message Handler
  this.messageHandler = new MessageHandler(
    {
      apiUrl: this.config.apiUrl,
      websiteName: this.config.websiteName,
      conversationId: this.conversationId,
      enableAttachments: this.config.enableAttachments,
      debug: this.config.debug
    },
    this.stateManager,
    this.uiManager,
    this.messageRenderer,
    this.persistenceManager,
    this.fileUploadManager
  );
  
  // Initialize Attachment Handler
  if (this.config.enableAttachments) {
    this.attachmentHandler = new AttachmentHandler(
      {
        enableAttachments: this.config.enableAttachments,
        maxFileSize: this.config.maxFileSize,
        maxAttachments: this.config.maxAttachments,
        acceptedFileTypes: this.config.acceptedFileTypes,
        debug: this.config.debug
      },
      this.uiManager,
      this.fileUploadManager
    );
  }
}
```

### 4. Replace method calls

Replace direct method calls with handler delegations:

#### Message Handling
```typescript
// OLD:
private async handleSendMessage(): Promise<void> {
  // ... implementation
}

// NEW:
private async handleSendMessage(): Promise<void> {
  await this.messageHandler.handleSendMessage(this.clientMetadata);
}
```

#### API Calls
```typescript
// OLD:
private async initializeChat(): Promise<void> {
  // ... direct API call
}

// NEW:
private async initializeChat(): Promise<void> {
  try {
    const response = await this.apiClient.initializeChat(
      this.conversationId,
      this.clientMetadata
    );
    
    if (response.metadata) {
      this.processAgentCapabilities(response.metadata);
    }
    
    await this.messageHandler.handleResponse(response.messages);
  } catch (error) {
    this.messageHandler.addErrorMessage(
      this.apiClient.formatError(error)
    );
  }
}
```

#### File Attachments
```typescript
// OLD:
private handleAttachmentClick(): void {
  // ... implementation
}

// NEW:
private handleAttachmentClick(): void {
  this.attachmentHandler.handleAttachmentClick();
}
```

### 5. Update event listeners

Update the attachEventListeners method to use handlers:

```typescript
private attachEventListeners(): void {
  // Send button
  const sendButton = this.uiManager.getElement('.am-chat-send');
  if (sendButton) {
    sendButton.addEventListener('click', () => {
      this.handleSendMessage();
    });
  }
  
  // Attachment button
  if (this.config.enableAttachments) {
    const attachButton = this.uiManager.getElement('.am-attach-button');
    if (attachButton) {
      attachButton.addEventListener('click', () => {
        this.attachmentHandler.handleAttachmentClick();
      });
    }
  }
}
```

### 6. Clean up in destroy()

```typescript
public destroy(): void {
  // ... existing cleanup
  
  // Clean up handlers
  this.messageHandler?.destroy();
  this.attachmentHandler?.destroy();
}
```

### 7. Remove extracted methods

Once the handlers are integrated, remove these methods from ChatWidget:
- `handleSendMessage()`
- `sendMessage()`
- `handleResponse()`
- `handleInitialResponse()`
- `addErrorMessage()`
- `isValidMessage()`
- `showLoadingIndicator()`
- `hideLoadingIndicator()`
- `handleAttachmentClick()`
- `handleFileSelect()`
- `handleAttachmentRemove()`
- `updateAttachmentPreview()`
- `renderMessageAttachments()`
- `getFileType()`
- `getAttachmentIcon()`
- `formatFileSize()`
- `fetchAgentCapabilities()`

## Benefits After Refactoring

1. **ChatWidget.ts** reduced from 2100+ lines to ~1200 lines
2. **Clear separation of concerns**
3. **Easier testing** - handlers can be tested independently
4. **Better maintainability** - changes are isolated
5. **Reusable components** - handlers can be used in other contexts

## Next Steps

1. Create ConversationHandler for conversation management
2. Create InitializationManager for setup logic
3. Create ThemeManager for theme handling
4. Further reduce ChatWidget to ~500-700 lines