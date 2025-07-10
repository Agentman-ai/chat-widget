// Debug script to test the addMessage logic

// Mock the attachment icons and FileUploadManager
const attachmentIcons = {
  document: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>`,
  image: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>`,
  file: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
    <polyline points="13 2 13 9 20 9"></polyline>
  </svg>`
};

const FileUploadManager = {
  formatFileSize: function(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

// Mock theme
const theme = {
  agentIconColor: '#059669'
};

// Mock icons
const defaultIcons = {
  userIcon: '<svg>user-icon</svg>',
  agentIcon: '<svg>agent-icon</svg>'
};

const config = {
  icons: {}
};

// Mock messageRenderer
const messageRenderer = {
  render: function(message) {
    return message.content;
  }
};

// The renderMessageAttachments function
function renderMessageAttachments(attachments) {
  if (!attachments || attachments.length === 0) return '';

  return `
    <div class="chat-message-attachments">
      ${attachments.map(attachment => {
        const isImage = attachment.file_type === 'image';
        const thumbnailHtml = isImage && attachment.url
          ? `<img src="${attachment.url}" alt="${attachment.filename}" class="chat-attachment-thumbnail" />`
          : `<div class="chat-attachment-icon">${attachmentIcons[attachment.file_type] || attachmentIcons.file}</div>`;

        return `
          <a href="${attachment.url}" target="_blank" rel="noopener noreferrer" class="chat-message-attachment" title="${attachment.filename}">
            ${thumbnailHtml}
            <div class="chat-attachment-info">
              <div class="chat-attachment-name">${attachment.filename}</div>
              <div class="chat-attachment-size">${FileUploadManager.formatFileSize(attachment.size_bytes)}</div>
            </div>
          </a>
        `;
      }).join('')}
    </div>
  `;
}

// Mock addMessage logic - simulate what happens in ChatWidget.ts
function simulateAddMessage(message) {
  console.log('=== Simulating addMessage ===');
  console.log('Input message:', JSON.stringify(message, null, 2));
  
  const renderedContent = messageRenderer.render(message);
  const icon = message.sender === 'user' 
    ? config.icons?.userIcon || defaultIcons.userIcon 
    : config.icons?.agentIcon || defaultIcons.agentIcon;

  // Render attachments if present
  const attachmentsHtml = message.attachments ? renderMessageAttachments(message.attachments) : '';
  
  console.log('\n=== Rendered components ===');
  console.log('Content:', renderedContent);
  console.log('Icon:', icon);
  console.log('Attachments HTML length:', attachmentsHtml.length);
  console.log('Attachments HTML:', attachmentsHtml);

  let messageHtml;
  
  // Only show avatar for agent messages, not for user messages
  if (message.sender === 'user') {
    messageHtml = `
      <div class="am-message-content">
        ${renderedContent}
        ${attachmentsHtml}
      </div>
    `;
  } else {
    messageHtml = `
      <div class="am-message-avatar ${message.sender}" style="color: ${theme.agentIconColor}">
        ${icon}
      </div>
      <div class="am-message-content">
        ${renderedContent}
        ${attachmentsHtml}
      </div>
    `;
  }
  
  console.log('\n=== Final message HTML ===');
  console.log(messageHtml);
  
  return messageHtml;
}

// Test with different message types
console.log('Testing addMessage logic...\n');

// Test 1: User message with attachments
const userMessage = {
  id: 'test-1',
  sender: 'user',
  content: 'Here are my files:',
  timestamp: new Date().toISOString(),
  type: 'text',
  attachments: [
    {
      file_id: 'file-1',
      filename: 'document.pdf',
      content_type: 'application/pdf',
      file_type: 'document',
      size_bytes: 1024000,
      url: 'https://example.com/file1.pdf',
      upload_status: 'success'
    }
  ]
};

simulateAddMessage(userMessage);

console.log('\n' + '='.repeat(50) + '\n');

// Test 2: Agent message with attachments
const agentMessage = {
  id: 'test-2',
  sender: 'agent',
  content: 'I\'ve processed your files. Here are the results:',
  timestamp: new Date().toISOString(),
  type: 'text',
  attachments: [
    {
      file_id: 'file-2',
      filename: 'results.jpg',
      content_type: 'image/jpeg',
      file_type: 'image',
      size_bytes: 256000,
      url: 'https://picsum.photos/300/200',
      upload_status: 'success'
    }
  ]
};

simulateAddMessage(agentMessage);

console.log('\n' + '='.repeat(50) + '\n');

// Test 3: Message without attachments
const simpleMessage = {
  id: 'test-3',
  sender: 'user',
  content: 'Hello there!',
  timestamp: new Date().toISOString(),
  type: 'text'
};

simulateAddMessage(simpleMessage);

console.log('\nAll tests completed!');