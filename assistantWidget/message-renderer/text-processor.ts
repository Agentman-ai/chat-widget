// src/components/assistant/message-renderer/text-processor.ts
import { MessageRendererOptions } from './types';
import { OfflineParser } from './offline-parser';
import { MarkdownLoader, MarkdownConfig } from '../utils/MarkdownLoader';

export class TextProcessor {
  private markdownLoadingPromise: Promise<boolean> | null = null;
  private markdownConfig: MarkdownConfig = {
    markedOptions: {
      gfm: true,
      breaks: true,
      headerIds: false,
      mangle: false,
      pedantic: false,
      smartLists: true,
      smartypants: false
    }
  };

  constructor(markdownConfig?: MarkdownConfig) {
    // Apply custom markdown configuration if provided
    if (markdownConfig) {
      this.markdownConfig = { ...this.markdownConfig, ...markdownConfig };
    }
    
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
        // Note: marked.setOptions is now handled in MarkdownLoader.getMarked()
        processed = marked.parse(processed);

        // Add target="_blank" to all links
        processed = processed.replace(
          /<a\s+(?:[^>]*?)href="([^"]*)"([^>]*?)>/gi,
          '<a href="$1" target="_blank" rel="noopener noreferrer" $2>'
        );

        // Style markdown images consistently with OfflineParser
        processed = processed.replace(
          /<img\s+([^>]*?)src="([^"]*)"([^>]*?)>/gi,
          (_match, before, src, after) => {
            // Extract alt text if present
            const altMatch = (before + after).match(/alt="([^"]*)"/);
            const altText = altMatch ? altMatch[1] : '';
            
            return `<div class="am-message-image-container">
              <img src="${src}" alt="${altText}" class="am-message-image" 
                   loading="lazy" onclick="window.open('${src}', '_blank')" 
                   title="Click to view full size" />
            </div>`;
          }
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
    this.markdownLoadingPromise = MarkdownLoader.loadMarked(this.markdownConfig);
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

}