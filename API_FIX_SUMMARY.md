# API Integration Fix Summary

## Issue
The refactored ChatWidget was not making backend requests correctly because:
1. Wrong API endpoint structure
2. Incorrect request parameters
3. Wrong response handling

## Original API Structure (from ChatWidget.ts)

### Endpoint
```
POST ${apiUrl}/v2/agentman_runtime/agent
```

### Request Body
```json
{
  "agent_token": "cjkqyuqoe0009jx081vgn38x7",
  "force_load": false,
  "conversation_id": "conv_1234567890_abc123",
  "user_input": "Hello",
  "client_metadata": { /* optional */ }
}
```

### Response Structure
```json
{
  "response": [
    {
      "type": "human",
      "content": "Hello"
    },
    {
      "type": "ai", 
      "content": "Hello! How can I help you today?"
    }
  ],
  "metadata": {
    "supported_mime_types": ["image/jpeg", "image/png"],
    "supports_attachments": true,
    "capabilities": ["file_upload", "markdown"]
  }
}
```

## Key Differences Fixed

### 1. API Endpoint
- ❌ Wrong: `${apiUrl}` (missing path)
- ✅ Correct: `${apiUrl}/v2/agentman_runtime/agent`

### 2. Request Parameters
- ❌ Wrong: `website_name`, `messages` array
- ✅ Correct: `agent_token`, `user_input` string

### 3. Response Processing
- ❌ Wrong: Expecting array directly
- ✅ Correct: Response wrapped in object with `response` and `metadata` fields

### 4. Message Filtering
- ❌ Wrong: Processing all messages
- ✅ Correct: Only processing `type: "ai"` messages, skipping `type: "human"`

### 5. Message Counting
- The API returns ALL messages in the conversation history
- Use `lastMessageCount` to slice and get only new messages
- Update `lastMessageCount` after processing

## Implementation Details

### Initialization Flow
```javascript
// During agent initialization
const response = await fetch(`${this.config.apiUrl}/v2/agentman_runtime/agent`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agent_token: this.config.agentToken,
    force_load: false,
    conversation_id: this.conversationId,
    user_input: initialMessage, // Default: 'Hello'
    ...(clientMetadata ? { client_metadata: clientMetadata } : {})
  })
});

const data = JSON.parse(await response.text());
if (data.response) {
  this.handleInitialResponse(data.response); // Process messages
  if (data.metadata) {
    this.processAgentCapabilities(data.metadata); // Extract capabilities
  }
}
```

### Message Sending Flow
```javascript
// When user sends a message
const requestBody = {
  agent_token: this.config.agentToken,
  force_load: false,
  conversation_id: this.conversationId,
  user_input: message,
  ...(clientMetadata ? { client_metadata: clientMetadata } : {})
};

// If attachments exist
if (attachmentUrls.length > 0) {
  requestBody.attachment_urls = attachmentUrls;
}

const response = await fetch(`${this.config.apiUrl}/v2/agentman_runtime/agent`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestBody)
});
```

### Response Processing
```javascript
// Handle response array
const newMessages = responseData.slice(this.lastMessageCount);

for (const msg of newMessages) {
  // Skip human messages (already displayed when sent)
  if (msg.type !== 'ai') continue;
  
  // Add agent message to UI
  if (this.isValidMessage(msg) && msg.content.trim()) {
    this.addMessage({
      id: msg.id ?? generateId(),
      sender: 'agent',
      content: msg.content,
      timestamp: new Date().toISOString(),
      type: 'text'
    });
  }
}

// Update count for next response
this.lastMessageCount = responseData.length;
```

## Testing

Use the updated `test-api.html` to:
1. Test raw API calls to verify endpoint and parameters
2. Create widget instance with proper configuration
3. Monitor console for detailed request/response logs

The widget now correctly:
- Makes requests to `/v2/agentman_runtime/agent`
- Sends proper `agent_token` and `user_input`
- Processes the wrapped response structure
- Filters messages by type
- Maintains conversation history count