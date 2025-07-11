// handlers/index.ts - Export all handlers
export { MessageHandler } from './MessageHandler';
export { APIClient } from './APIClient';
export { AttachmentHandlerSimple } from './AttachmentHandlerSimple';

// Export types
export type { MessageHandlerConfig } from './MessageHandler';
export type { APIConfig, ChatInitResponse, SendMessageRequest, SendMessageResponse } from './APIClient';
export type { AttachmentHandlerConfig } from './AttachmentHandlerSimple';