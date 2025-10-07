// styles/messages.ts
export const messageStyles = `
  .am-message {
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }

  .am-message.user {
    margin-top: 0px;
    margin-bottom: 12px;
  }

  .am-message-content {
    padding: 0;
    border-radius: 0;
    font-size: 14px;
    width: 100%;
    word-wrap: break-word;
    line-height: 1.6;
    background: none;
    border: none;
  }

  .am-message.agent .am-message-content {
    color: var(--chat-agent-foreground-color, var(--chat-text-color, #111827));
  }

  .am-message.user .am-message-content {
    color: var(--chat-user-foreground-color, var(--chat-text-color, #111827));
  }

  /* Role labels */
  .am-message-role {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .am-message.agent .am-message-role {
    color: #111827;
  }

  .am-message.user .am-message-role {
    color: #2563eb;
  }

  // Content formatting - Reduce spacing
  .am-message.agent .am-message-content br {
    content: "";
    display: block;
    margin-top: 0.2em;
  }

  .am-message-avatar {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    margin-top: 4px;
  }

  .am-message-avatar img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }

  .am-message.user .am-message-avatar {
    width: 28px;
    height: 28px;
    margin-top: 16px;
  }
  

  /* Typography and spacing */
  .am-message-content p {
    margin: 0 0 8px 0;
  }

  .am-message-content p:last-child {
    margin-bottom: 0;
  }  

  /* Enhanced Lists styling */
  .am-message-content ul,
  .am-message-content ol {
    margin: 4px 0;
    padding-left: 20px;
    list-style-position: outside;
  }

  .am-message-content ul {
    list-style-type: disc;
  }

  .am-message-content ol {
    list-style-type: decimal;
  }

  /* Nested lists */
  .am-message-content ul ul,
  .am-message-content ol ul {
    list-style-type: circle;
  }

  .am-message-content ul ul ul,
  .am-message-content ol ul ul {
    list-style-type: square;
  }

  .am-message-content ol ol,
  .am-message-content ul ol {
    list-style-type: lower-alpha;
  }

  .am-message-content ol ol ol,
  .am-message-content ul ol ol {
    list-style-type: lower-roman;
  }

  .am-message-content li {
    margin: 4px 0;
    padding-left: 4px;
    line-height: 1.4;
    display: list-item; /* Ensures list markers are visible */
  }

  /* Remove margins for nested lists */
  .am-message-content li > ul,
  .am-message-content li > ol {
    margin: 2px 0;
  }

  /* Links styling */
  .am-message-content a {
    color: #2563eb;
    text-decoration: none;
    font-weight: 500;
  }

  .am-message.user .am-message-content a {
    color: inherit;
  }

  .am-message-content a:hover {
    text-decoration: underline;
  }

  /* Strong and emphasis */
  .am-message-content strong {
    font-weight: 600;
  }

  .am-message-content em {
    font-style: italic;
  }  

  .am-message-content h1,
  .am-message-content h2,
  .am-message-content h3,
  .am-message-content h4,
  .am-message-content h5,
  .am-message-content h6 {
    font-weight: 500;
    line-height: 1.3;
    margin: 16px 0 8px 0;  
  }

  .am-message-content h2,
  .am-message-content h3 {
    margin-top: 24px;  /* More space above section headers */
    margin-bottom: 12px;  /* More space below before content */
  }  

  .am-message-content h1 { font-size: 1.4em; }
  .am-message-content h2 { font-size: 1.3em; }
  .am-message-content h3 { font-size: 1.2em; }
  .am-message-content h4 { font-size: 1.1em; }
  .am-message-content h5 { font-size: 1em; }
  .am-message-content h6 { font-size: 0.9em; }

  /* Ensure first and last headings don't add extra spacing */
  .am-message-content > h1:first-child,
  .am-message-content > h2:first-child,
  .am-message-content > h3:first-child,
  .am-message-content > h4:first-child,
  .am-message-content > h5:first-child,
  .am-message-content > h6:first-child {
    margin-top: 0;
  }

  .am-message-content > h1:last-child,
  .am-message-content > h2:last-child,
  .am-message-content > h3:last-child,
  .am-message-content > h4:last-child,
  .am-message-content > h5:last-child,
  .am-message-content > h6:last-child {
    margin-bottom: 0;
  }

  /* Add space after paragraphs */
  .am-message-content p + h1,
  .am-message-content p + h2,
  .am-message-content p + h3,
  .am-message-content p + h4,
  .am-message-content p + h5,
  .am-message-content p + h6 {
    margin-top: 24px;  /* More space when heading follows paragraph */
  }  

  /* Adjust list spacing after headers */
  .am-message-content h1 + ul,
  .am-message-content h2 + ul,
  .am-message-content h3 + ul,
  .am-message-content h4 + ul,
  .am-message-content h5 + ul,
  .am-message-content h6 + ul {
    margin-top: 12px;
  }


  /* Code blocks */
  .am-message-content code {
    background: rgba(0, 0, 0, 0.05);
    padding: 2px 4px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
  }

  .am-message-content pre {
    background: rgba(0, 0, 0, 0.05);
    padding: 12px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 8px 0;
  }

  .am-message-content pre code {
    background: none;
    padding: 0;
  }

  /* Markdown image styling */
  .am-message-image-container {
    margin: 12px 0;
    max-width: 100%;
    text-align: left;
  }

  .am-message-image {
    max-width: min(100%, 320px);  /* Fluid but capped */
    max-height: 300px;
    width: auto;
    height: auto;
    display: block;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    object-fit: contain;  /* Better than cover for content visibility */
  }

  .am-message-image:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  /* Mobile responsiveness */
  @media (max-width: 480px) {
    .am-message-image {
      max-width: 100%;
      max-height: 250px;
    }
  }

  /* Loading state */
  .am-message-image:not([src]), 
  .am-message-image[src=""] {
    background: #f3f4f6;
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .am-message-image:not([src]):before,
  .am-message-image[src=""]:before {
    content: "Loading image...";
    color: #666;
    font-size: 14px;
  }

  /* Fallback for any images not wrapped (safety net) */
  .am-message-content img:not(.am-message-image) {
    max-width: 100%;
    max-height: 300px;
    height: auto;
    display: block;
    margin: 8px 0;
    border-radius: 8px;
  }

  /* Blockquotes */
  .am-message-content blockquote {
    border-left: 4px solid #2563eb;
    margin: 8px 0;
    padding: 4px 12px;
    color: #4b5563;
  }

  /* Tables */
  .am-message-content table {
    border-collapse: collapse;
    width: 100%;
    margin: 8px 0;
  }

  .am-message-content th,
  .am-message-content td {
    border: 1px solid rgba(0, 0, 0, 0.1);
    padding: 8px;
    text-align: left;
  }

  .am-message-content th {
    background: rgba(0, 0, 0, 0.05);
    font-weight: 600;
  }

  /* Remove margin top from first element */
  .am-message-content > *:first-child {
    margin-top: 0;
  }

  /* Remove margin bottom from last element */
  .am-message-content > *:last-child {
    margin-bottom: 0;
  }


  @media (max-width: 480px) {
    .am-message-content {
      font-size: 16px;
      padding: 0;  /* Keep padding consistent with desktop */
    }
    
    .am-message-content ul,
    .am-message-content ol {
      padding-left: 20px;
    }
  }

  /* Input component styles moved to input.ts */
`;
