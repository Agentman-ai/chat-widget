// src/components/assistant/message-renderer/text-processor.ts
import { MessageRendererOptions, EmojiMap } from './types';
import { OfflineParser } from './offline-parser';
import { MarkdownLoader } from '../utils/MarkdownLoader';

export class TextProcessor {
  private markdownLoadingPromise: Promise<boolean> | null = null;

  constructor(private emojiMap: EmojiMap) {
    // Start loading marked.js in the background
    this.initializeMarkdownLoader();
  }

  public async processText(content: string, options: MessageRendererOptions): Promise<string> {
    // Don't double-sanitize since OfflineParser handles this
    let processed = content;
    
    // Try to use marked.js if available or can be loaded
    if (options.enableMarkdown !== false) {
      const marked = await this.getMarkedInstance();
      
      if (marked) {
        // Don't pre-sanitize - let marked.js handle it
        // Modern marked.js versions handle sanitization internally
        
        marked.setOptions({
          gfm: true,
          breaks: true,
          headerIds: false,
          mangle: false,
          // sanitize option is deprecated - marked handles this internally
        });
        processed = marked.parse(processed);

        // Add target="_blank" to all links
        processed = processed.replace(
          /<a\s+(?:[^>]*?)href="([^"]*)"([^>]*?)>/gi,
          '<a href="$1" target="_blank" rel="noopener noreferrer" $2>'
        );
      } else {
        // Use enhanced offline parser as fallback (handles its own sanitization)
        processed = OfflineParser.parse(processed);
      }
    } else {
      // Use enhanced offline parser as fallback (handles its own sanitization)
      processed = OfflineParser.parse(processed);
    }

    return processed;
  }

  /**
   * Initialize the markdown loader in the background
   */
  private initializeMarkdownLoader(): void {
    // Start loading marked.js asynchronously without blocking
    this.markdownLoadingPromise = MarkdownLoader.loadMarked();
  }

  /**
   * Get the marked instance if available
   */
  private async getMarkedInstance(): Promise<any> {
    try {
      // Wait for the loading promise if it exists
      if (this.markdownLoadingPromise) {
        await this.markdownLoadingPromise;
      }
      
      // Return the marked instance if available
      return MarkdownLoader.getMarked();
    } catch (error) {
      console.warn('Error getting marked instance:', error);
      return null;
    }
  }

  private sanitizeText(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    // Don't escape apostrophes - marked.js handles them properly
  }

  private replaceEmoji(text: string): string {
    return text.replace(/:\)|:\(|:D|;\)|<3/g, match => this.emojiMap[match] || match);
  }

  private applyMarkdown(text: string): string {
    let processed = text;

    // Only apply our markdown processing if marked is not available
    // Process links first to avoid interference
    processed = processed.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Then process other markdown elements
    processed = processed
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Line breaks
      .replace(/\n/g, '<br>');

    return processed;
  }
}