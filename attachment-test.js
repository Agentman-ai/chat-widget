// Simple Node.js test to verify attachment rendering logic

// Mock the attachment icons
const attachmentIcons = {
  document: '<svg>document-icon</svg>',
  image: '<svg>image-icon</svg>',
  file: '<svg>file-icon</svg>'
};

// Mock FileUploadManager.formatFileSize
const FileUploadManager = {
  formatFileSize: function(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

// The renderMessageAttachments function from ChatWidget.ts
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

// Test data
const testMessage = {
  id: 'test-msg-1',
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
    },
    {
      file_id: 'file-2', 
      filename: 'image.jpg',
      content_type: 'image/jpeg',
      file_type: 'image',
      size_bytes: 512000,
      url: 'https://picsum.photos/200/150',
      upload_status: 'success'
    }
  ]
};

// Test the rendering
console.log('Testing attachment rendering...');
console.log('Input message:', JSON.stringify(testMessage, null, 2));

const result = renderMessageAttachments(testMessage.attachments);
console.log('\nRendered HTML:');
console.log(result);

console.log('\nTest completed successfully!');