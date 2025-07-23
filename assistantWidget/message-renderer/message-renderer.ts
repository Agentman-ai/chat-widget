// src/components/assistant/message-renderer/message-renderer.ts
import type { Message } from '../types/types';
import type { MessageRendererOptions, ProcessedContent, EmojiMap } from './types';
import { TextProcessor } from './text-processor';
import { SvgProcessor } from './svg-processor';
import { defaultEmojiMap } from './emoji-map';
import { CustomRenderer } from './custom-renderer';

export class MessageRenderer {
  private static readonly defaultOptions: MessageRendererOptions = {
    enableMarkdown: true,
    enableHtml: false,
    enableEmoji: true,
    enableLinks: true,
    enableSvg: true
  };

  private readonly options: MessageRendererOptions;
  private readonly emojiMap: EmojiMap;
  private readonly textProcessor: TextProcessor;
  private readonly svgProcessor: SvgProcessor;
  private readonly customRenderer: CustomRenderer;

  constructor(
    options: Partial<MessageRendererOptions> = {},
    customEmojiMap: Partial<EmojiMap> = {}
  ) {
    this.options = { ...MessageRenderer.defaultOptions, ...options };

    // Fix: Filter out undefined values and ensure all values are strings
    const validEmojiEntries = Object.entries(customEmojiMap)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string');

    this.emojiMap = {
      ...defaultEmojiMap,
      ...Object.fromEntries(validEmojiEntries)
    };

    this.textProcessor = new TextProcessor(this.emojiMap);
    this.svgProcessor = new SvgProcessor();
    this.customRenderer = new CustomRenderer();
  }


  async render(message: Message): Promise<string> {
    
    if (!message?.content) return '';

    try {
      let content: string;

      switch (message.type) {
        case 'html':
          // For HTML type, only sanitize if HTML is not allowed
          content = this.options.enableHtml ? 
            this.sanitizeHtml(message.content) : 
            await this.textProcessor.processText(message.content, this.options);
          break;

          case 'svg':
            content = this.options.enableSvg ? 
              this.svgProcessor.processSvg(message.content) : 
              message.content;
            break;
  
          case 'custom':
            // Handle custom message types (like buttons, cards, etc.)
            content = this.customRenderer.renderCustom(message);
            break;

          case 'text':
          default:
            return await this.processTextWithSvg(message.content);
            break;
      }

      return content;

    } catch (error) {
      console.error('Error rendering message:', error);
      return `<div class="message-error">Error rendering message</div>`;
    }
  }

  private async processTextWithSvg(content: string): Promise<string> {
    // Find SVG code blocks
    const matches = content.match(/```svg([\s\S]*?)```/g) || [];
    const blocks = content.split(/```svg[\s\S]*?```/);
    
    // Process blocks alternatively (text and SVG)
    let result = '';
    
    for (let i = 0; i < blocks.length; i++) {
      // Process text block
      if (blocks[i]) {
        result += await this.textProcessor.processText(blocks[i], this.options);
      }
      
      // Process SVG block if exists
      if (matches[i]) {
        const svgContent = matches[i].replace(/```svg\s*|\s*```/g, '');
        result += this.svgProcessor.processSvg(svgContent);
      }
    }
    
    return result;
  }

  private sanitizeHtml(html: string): string {
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
}
