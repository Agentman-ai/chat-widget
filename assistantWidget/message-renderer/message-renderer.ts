// src/components/assistant/message-renderer/message-renderer.ts
import type { Message } from '../types/types';
import type { MessageRendererOptions } from './types';
import { TextProcessor } from './text-processor';
import { SvgProcessor } from './svg-processor';
import { CustomRenderer } from './custom-renderer';
import type { MarkdownConfig } from '../utils/MarkdownLoader';

export interface MessageRendererConfig {
  options?: Partial<MessageRendererOptions>;
  markdownConfig?: MarkdownConfig;
}

export class MessageRenderer {
  private static readonly defaultOptions: MessageRendererOptions = {
    enableMarkdown: true,
    enableHtml: false,
    enableEmoji: true,
    enableLinks: true,
    enableSvg: true
  };

  private readonly options: MessageRendererOptions;
  private readonly textProcessor: TextProcessor;
  private readonly svgProcessor: SvgProcessor;
  private readonly customRenderer: CustomRenderer;

  constructor(
    config: MessageRendererConfig | Partial<MessageRendererOptions> = {}
  ) {
    // Handle both old and new constructor signatures for backward compatibility
    let options: Partial<MessageRendererOptions>;
    let markdownConfig: MarkdownConfig | undefined;
    
    if ('options' in config || 'markdownConfig' in config) {
      // New config object format
      const rendererConfig = config as MessageRendererConfig;
      options = rendererConfig.options || {};
      markdownConfig = rendererConfig.markdownConfig;
    } else {
      // Legacy options format
      options = config as Partial<MessageRendererOptions>;
    }
    
    this.options = { ...MessageRenderer.defaultOptions, ...options };

    this.textProcessor = new TextProcessor(markdownConfig);
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
            content = await this.processTextWithSvg(message.content);
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
