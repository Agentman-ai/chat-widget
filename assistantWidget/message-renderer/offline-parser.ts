export class OfflineParser {
  // Common emoji mappings for basic support
  static emojiMap = {
    ':)': '😊', ':-)': '😊', ':(': '😢', ':-(': '😢',
    ':D': '😃', ':-D': '😃', ':P': '😛', ':-P': '😛',
    ';)': '😉', ';-)': '😉', ':o': '😮', ':-o': '😮',
    '<3': '❤️', '</3': '💔', ':+1:': '👍', ':-1:': '👎',
    ':fire:': '🔥', ':rocket:': '🚀', ':star:': '⭐', ':check:': '✅'
  };

  static rules = {
    // Headers - enhanced with HTML escaping for content
    h1: { 
      pattern: /^#\s+(.+)$/gm, 
      replace: (match: string, content: string) => `<h1>${OfflineParser.escapeHtml(content)}</h1>` 
    },
    h2: { 
      pattern: /^##\s+(.+)$/gm, 
      replace: (match: string, content: string) => `<h2>${OfflineParser.escapeHtml(content)}</h2>` 
    },
    h3: { 
      pattern: /^###\s+(.+)$/gm, 
      replace: (match: string, content: string) => `<h3>${OfflineParser.escapeHtml(content)}</h3>` 
    },
    
    // Emphasis - enhanced with HTML escaping
    bold: { 
      pattern: /\*\*(.*?)\*\*/g, 
      replace: (match: string, content: string) => `<strong>${OfflineParser.escapeHtml(content)}</strong>` 
    },
    italic: { 
      pattern: /\*(.*?)\*/g, 
      replace: (match: string, content: string) => `<em>${OfflineParser.escapeHtml(content)}</em>` 
    },
    
    // Links and URLs - enhanced validation and escaping
    markdownLink: { 
      pattern: /\[([^\]]+)\]\(([^)]+)\)/g, 
      replace: (match: string, text: string, url: string) => {
        const safeUrl = OfflineParser.sanitizeUrl(url.trim());
        const safeText = OfflineParser.escapeHtml(text);
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeText}</a>`;
      }
    },
    autoLink: { 
      pattern: /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)])/g, 
      replace: (match: string, url: string) => {
        const safeUrl = OfflineParser.sanitizeUrl(url);
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${OfflineParser.escapeHtml(url)}</a>`;
      }
    },
    
    // Code - enhanced with HTML escaping
    inlineCode: { 
      pattern: /`([^`]+)`/g, 
      replace: (match: string, content: string) => `<code>${OfflineParser.escapeHtml(content)}</code>` 
    },
    codeBlock: { 
      pattern: /```([\s\S]*?)```/g, 
      replace: (match: string, content: string) => `<pre><code>${OfflineParser.escapeHtml(content)}</code></pre>` 
    },
    
    // Lists are now processed separately to prevent duplication
    
    // Blockquotes - enhanced with HTML escaping
    blockquote: { 
      pattern: /^>\s+(.+)/gm, 
      replace: (match: string, content: string) => `<blockquote>${OfflineParser.escapeHtml(content)}</blockquote>` 
    },
    
    // Line breaks
    lineBreak: { pattern: /\n/g, replace: '<br>' },
    
    // Email auto-linking
    autoEmail: {
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      replace: (match: string, email: string) => `<a href="mailto:${email}">${OfflineParser.escapeHtml(email)}</a>`
    }
  };

  static parse(text: string): string {
    // Handle null, undefined, or non-string values
    if (text == null || typeof text !== 'string') {
      return '';
    }
    
    try {
      let html = text;

      // Process emojis first
      html = this.processEmojis(html);

      // Process code blocks first to prevent interference
      if (this.rules.codeBlock.pattern.test(html)) {
        html = html.replace(this.rules.codeBlock.pattern, this.rules.codeBlock.replace);
      }

      // Process headers
      html = html
        .replace(this.rules.h3.pattern, this.rules.h3.replace)
        .replace(this.rules.h2.pattern, this.rules.h2.replace)
        .replace(this.rules.h1.pattern, this.rules.h1.replace);

      // Process lists - fixed to prevent duplication
      html = this.processLists(html);

      // Process inline formatting
      html = html
        .replace(this.rules.bold.pattern, this.rules.bold.replace)
        .replace(this.rules.italic.pattern, this.rules.italic.replace)
        .replace(this.rules.inlineCode.pattern, this.rules.inlineCode.replace);

      // Process links (emails first, then markdown, then auto-links)
      html = html
        .replace(this.rules.autoEmail.pattern, this.rules.autoEmail.replace)
        .replace(this.rules.markdownLink.pattern, this.rules.markdownLink.replace)
        .replace(this.rules.autoLink.pattern, this.rules.autoLink.replace);

      // Process blockquotes
      html = html.replace(this.rules.blockquote.pattern, this.rules.blockquote.replace);

      // Process line breaks last
      html = html.replace(this.rules.lineBreak.pattern, this.rules.lineBreak.replace);

      return html;
    } catch (error) {
      console.warn('Offline parser error:', error);
      return this.escapeHtml(text); // Return escaped text if parsing fails
    }
  }

  // Helper method to escape HTML entities
  static escapeHtml(text: string): string {
    // Handle null, undefined, or non-string values
    if (text == null || typeof text !== 'string') {
      return '';
    }
    
    const htmlEscapes: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    return text.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
  }

  // Helper method to process emojis
  static processEmojis(text: string): string {
    // Handle null, undefined, or non-string values
    if (text == null || typeof text !== 'string') {
      return '';
    }
    
    let result = text;
    for (const [emoticon, emoji] of Object.entries(this.emojiMap)) {
      // Escape special regex characters in emoticon
      const escapedEmoticon = emoticon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escapedEmoticon, 'g'), emoji);
    }
    return result;
  }

  // Helper method to sanitize URLs
  static sanitizeUrl(url: string): string {
    // Handle null, undefined, or non-string values
    if (url == null || typeof url !== 'string') {
      return '#';
    }
    
    try {
      const parsed = new URL(url);
      return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? url : '#';
    } catch {
      return '#';
    }
  }

  // Helper method to validate and process markdown links safely
  static processMarkdownLink(text: string, url: string): string {
    // Handle null, undefined, or non-string values
    if (text == null || typeof text !== 'string') {
      text = '';
    }
    if (url == null || typeof url !== 'string') {
      url = '';
    }
    
    const safeUrl = this.sanitizeUrl(url.trim());
    const safeText = this.escapeHtml(text);
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeText}</a>`;
  }

  // Helper method to process lists without duplication
  private static processLists(text: string): string {
    let result = text;
    
    // Process numbered lists
    result = this.processNumberedLists(result);
    
    // Process bullet lists
    result = this.processBulletLists(result);
    
    return result;
  }

  private static processNumberedLists(text: string): string {
    const lines = text.split('\n');
    const processedLines: string[] = [];
    let inList = false;
    let listItems: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^\s*\d+\.\s+(.+)/);

      if (match) {
        // This is a numbered list item
        if (!inList) {
          inList = true;
          listItems = [];
        }
        // Extract content without the number, let <ol> handle numbering
        listItems.push(`<li>${this.escapeHtml(match[1].trim())}</li>`);
      } else if (inList && line.trim() === '') {
        // Empty line within a list - skip it but stay in list mode
        continue;
      } else if (inList && line.match(/^\s+/) && !line.match(/^\s*\d+\./)) {
        // Indented continuation of previous list item - skip it but stay in list mode
        continue;
      } else {
        // Not a list item and not empty/indented content within list
        if (inList) {
          // End the current list
          processedLines.push(`<ol>${listItems.join('')}</ol>`);
          inList = false;
          listItems = [];
        }
        
        // Add the line if it's not empty or if we're not in a list
        if (line.trim() !== '') {
          processedLines.push(line);
        }
      }
    }

    // Handle case where text ends with a list
    if (inList && listItems.length > 0) {
      processedLines.push(`<ol>${listItems.join('')}</ol>`);
    }

    return processedLines.join('\n');
  }

  private static processBulletLists(text: string): string {
    const lines = text.split('\n');
    const processedLines: string[] = [];
    let inList = false;
    let listItems: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^\s*[-*+]\s+(.+)/);

      if (match) {
        // This is a bullet list item
        if (!inList) {
          inList = true;
          listItems = [];
        }
        listItems.push(`<li>${this.escapeHtml(match[1].trim())}</li>`);
      } else if (inList && line.trim() === '') {
        // Empty line within a list - skip it but stay in list mode
        continue;
      } else if (inList && line.match(/^\s+/) && !line.match(/^\s*[-*+]\s/)) {
        // Indented continuation of previous list item - skip it but stay in list mode
        continue;
      } else {
        // Not a list item and not empty/indented content within list
        if (inList) {
          // End the current list
          processedLines.push(`<ul>${listItems.join('')}</ul>`);
          inList = false;
          listItems = [];
        }
        
        // Add the line if it's not empty
        if (line.trim() !== '') {
          processedLines.push(line);
        }
      }
    }

    // Handle case where text ends with a list
    if (inList && listItems.length > 0) {
      processedLines.push(`<ul>${listItems.join('')}</ul>`);
    }

    return processedLines.join('\n');
  }

  // Helper method to check if content should skip HTML escaping (for already processed HTML)
  static isProcessedHtml(content: string): boolean {
    return /<[^>]+>/.test(content);
  }
}
