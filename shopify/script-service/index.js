/**
 * Shopify Script Tag Service for Agentman ChatWidget
 * 
 * This script provides a direct connection to the agent runtime without requiring
 * an intermediate backend. It offers full WordPress feature parity for Shopify stores.
 * 
 * Usage: <script src="https://cdn.agentman.ai/shopify/v1/widget.js" data-agent-token="YOUR_TOKEN"></script>
 */

(function() {
    'use strict';
    
    // Script metadata
    const SCRIPT_VERSION = '5.5.1';
    // Use your own CDN URL for the core widget
    const WIDGET_CDN = 'https://storage.googleapis.com/chatwidget-shopify-storage-for-cdn/core/chat-widget.js';
    
    // Extract configuration from script tag
    // For async scripts, document.currentScript may be null, so we need a more robust selector
    const currentScript = document.currentScript || 
                         document.querySelector('script[src*="widget.js"]') ||
                         document.querySelector('script[src*="chatwidget-shopify-storage-for-cdn"]');
    const agentToken = currentScript?.getAttribute('data-agent-token');
    const configId = currentScript?.getAttribute('data-config-id');
    const customApiUrl = currentScript?.getAttribute('data-api-url');
    
    // Debug logging
    if (!currentScript) {
        logError('Could not find script tag - data attributes will not be read');
    } else {
        logInfo(`Found script tag. API URL: ${customApiUrl || 'not set'}, Token: ${agentToken ? 'set' : 'not set'}`);
    }
    
    // Extract widget appearance options from data attributes
    const extractDataAttribute = (name, defaultValue, parser = (v) => v) => {
        const value = currentScript?.getAttribute(`data-${name}`);
        if (value === null || value === undefined) return defaultValue;
        try {
            return parser(value);
        } catch (e) {
            logError(`Invalid data-${name} value: ${value}`, e);
            return defaultValue;
        }
    };
    
    // Extract configuration options that can be set from Shopify liquid
    const configOverrides = {
        variant: extractDataAttribute('variant', 'corner'),
        position: extractDataAttribute('position', 'bottom-right'),
        initialHeight: extractDataAttribute('initial-height', '600px'),
        initialWidth: extractDataAttribute('initial-width', '460px'),
        title: extractDataAttribute('title', 'AI Assistant'),
        placeholder: extractDataAttribute('placeholder', 'Ask me anything...'),
        toggleText: extractDataAttribute('toggle-text', 'Ask Agentman'),
        initiallyOpen: extractDataAttribute('initially-open', false, v => v === 'true'),
        enableAttachments: extractDataAttribute('enable-attachments', true, v => v === 'true'),
        
        // Welcome screen settings (v1.0.19+)
        showWelcomeScreen: extractDataAttribute('show-welcome-screen', true, v => v === 'true'),
        showWelcomeMinimize: extractDataAttribute('show-welcome-minimize', true, v => v === 'true'),
        floatingPromptsEnabled: extractDataAttribute('floating-prompts-enabled', true, v => v === 'true'),
        floatingPromptsDelay: extractDataAttribute('floating-prompts-delay', 5000, v => parseInt(v, 10)),
        
        // AI Disclaimer settings
        'disclaimer.enabled': extractDataAttribute('disclaimer-enabled', false, v => v === 'true'),
        'disclaimer.message': extractDataAttribute('disclaimer-message', 'AI-generated responses'),
        'disclaimer.linkText': extractDataAttribute('disclaimer-link-text', ''),
        'disclaimer.linkUrl': extractDataAttribute('disclaimer-link-url', ''),
        
        // Theme colors
        'theme.backgroundColor': extractDataAttribute('bg-color', '#ffffff'),
        'theme.textColor': extractDataAttribute('text-color', '#111827'),
        'theme.buttonColor': extractDataAttribute('button-color', '#2563eb'),
        'theme.buttonTextColor': extractDataAttribute('button-text-color', '#ffffff'),
        'theme.agentForegroundColor': extractDataAttribute('agent-color', '#111827'),
        'theme.userForegroundColor': extractDataAttribute('user-color', '#2563eb'),
        'theme.toggleBackgroundColor': extractDataAttribute('toggle-bg-color', '#2563eb'),
        'theme.toggleTextColor': extractDataAttribute('toggle-text-color', '#ffffff'),
        'theme.toggleIconColor': extractDataAttribute('toggle-icon-color', '#ffffff'),
        
        // Message prompts
        'messagePrompts.show': extractDataAttribute('show-prompts', true, v => v === 'true'),
        'messagePrompts.welcome_message': extractDataAttribute('welcome-message', 'How can I help you today?'),
        'messagePrompts.prompt1': extractDataAttribute('prompt-1', 'Track my order'),
        'messagePrompts.prompt2': extractDataAttribute('prompt-2', 'Product information'),
        'messagePrompts.prompt3': extractDataAttribute('prompt-3', 'Return policy'),
        'messagePrompts.prompt4': extractDataAttribute('prompt-4', 'Other questions'),
        
        // Persistence settings
        'persistence.enabled': extractDataAttribute('persistence-enabled', true, v => v === 'true'),
        'persistence.days': extractDataAttribute('persistence-days', 7, v => parseInt(v, 10))
    };
    
    // Configuration service URL (for advanced configurations)
    const CONFIG_SERVICE_URL = 'https://config.agentman.ai/shopify';
    
    // Helper function to apply configuration overrides using dot notation
    function applyConfigOverrides(config, overrides) {
        const result = { ...config };
        
        // Ensure nested objects exist
        if (!result.theme) result.theme = {};
        if (!result.messagePrompts) result.messagePrompts = {};
        if (!result.persistence) result.persistence = {};
        
        for (const [key, value] of Object.entries(overrides)) {
            if (value !== null && value !== undefined) {
                if (key.includes('.')) {
                    // Handle nested properties (e.g., 'theme.backgroundColor')
                    const [parent, child] = key.split('.');
                    if (parent === 'messagePrompts' && child.startsWith('prompt')) {
                        // Handle prompt array specially
                        if (!result.messagePrompts.prompts) result.messagePrompts.prompts = [];
                        const promptIndex = parseInt(child.replace('prompt', '')) - 1;
                        result.messagePrompts.prompts[promptIndex] = value;
                    } else {
                        if (!result[parent]) result[parent] = {};
                        // For disclaimer, skip empty string values for linkText and linkUrl
                        if (parent === 'disclaimer' && (child === 'linkText' || child === 'linkUrl') && value === '') {
                            continue;
                        }
                        result[parent][child] = value;
                    }
                } else {
                    // Handle top-level properties
                    result[key] = value;
                }
            }
        }
        
        // Clean up disclaimer object if not enabled
        if (result.disclaimer && !result.disclaimer.enabled) {
            delete result.disclaimer;
        } else if (result.disclaimer) {
            // Remove empty linkText and linkUrl
            if (!result.disclaimer.linkText) delete result.disclaimer.linkText;
            if (!result.disclaimer.linkUrl) delete result.disclaimer.linkUrl;
        }
        
        return result;
    }
    
    // Default configuration matching WordPress feature parity
    const defaultConfig = {
        // Required
        agentToken: agentToken || '',
        apiUrl: customApiUrl || 'https://studio-api.agentman.ai',
        containerId: 'agentman-chat-shopify',
        
        // Widget behavior
        variant: 'corner',
        position: 'bottom-right',
        initialHeight: '600px',
        initialWidth: '460px',
        title: 'AI Assistant',
        placeholder: 'Ask me anything...',
        toggleText: 'Ask Agentman',
        initiallyOpen: false,
        enableAttachments: true,
        
        // Welcome screen settings (v1.0.19+)
        showWelcomeScreen: true,
        showWelcomeMinimize: true,
        floatingPromptsEnabled: true,
        floatingPromptsDelay: 5000,
        
        // Theme system (matching simplified WordPress theme)
        theme: {
            backgroundColor: '#ffffff',
            textColor: '#111827',
            buttonColor: '#2563eb',
            buttonTextColor: '#ffffff',
            agentForegroundColor: '#111827',
            userForegroundColor: '#2563eb',
            toggleBackgroundColor: '#2563eb',
            toggleTextColor: '#ffffff',
            toggleIconColor: '#ffffff'
        },
        
        // Content
        initialMessage: '', // Empty to prevent duplicate messages
        messagePrompts: {
            show: true,
            welcome_message: 'How can I help you today?',
            prompts: [
                'Track my order',
                'Product information',
                'Return policy'
            ]
        },
        
        // Advanced features
        persistence: {
            enabled: true,
            days: 7
        },
        
        // Shopify-specific enhancements
        shopifyIntegration: {
            customerData: true,
            cartSync: true,
            orderLookup: true,
            platform: 'shopify'
        },
        
        // Shopify-specific CSS optimizations
        cssOptimizations: {
            zIndexBase: 100000,
            preventThemeConflicts: true,
            mobileOptimized: true
        }
    };
    
    // Error handling and logging
    function logError(message, error = null) {
        console.error(`[Agentman Shopify] ${message}`, error);
        
        // Send error telemetry (optional)
        if (window.agentmanTelemetry) {
            window.agentmanTelemetry.logError('shopify_integration', message, error);
        }
    }
    
    function logInfo(message) {
        console.log(`[Agentman Shopify] ${message}`);
    }
    
    // Configuration loading
    async function loadConfiguration() {
        let config = { ...defaultConfig };
        
        // Load from configuration service if configId provided
        if (configId) {
            try {
                const response = await fetch(`${CONFIG_SERVICE_URL}/${configId}`);
                if (response.ok) {
                    const remoteConfig = await response.json();
                    config = { ...config, ...remoteConfig };
                    logInfo(`Loaded remote configuration: ${configId}`);
                }
            } catch (error) {
                logError('Failed to load remote configuration, using defaults', error);
            }
        }
        
        // Override with script tag attributes
        if (agentToken) config.agentToken = agentToken;
        if (customApiUrl) config.apiUrl = customApiUrl;
        
        // Apply data attribute overrides
        config = applyConfigOverrides(config, configOverrides);
        
        return config;
    }
    
    // Shopify environment detection and data collection
    function collectShopifyData() {
        const shopifyData = {};
        
        try {
            // Basic Shopify detection
            if (window.Shopify) {
                shopifyData.platform = 'shopify';
                shopifyData.shop = window.Shopify.shop;
                shopifyData.theme = window.Shopify.theme;
                
                // Customer data
                if (window.ShopifyAnalytics?.meta?.page?.customerId) {
                    shopifyData.customerId = window.ShopifyAnalytics.meta.page.customerId;
                }
                
                // Cart data
                if (window.Shopify.cart) {
                    shopifyData.cart = {
                        item_count: window.Shopify.cart.item_count,
                        total_price: window.Shopify.cart.total_price,
                        currency: window.Shopify.currency?.active || 'USD'
                    };
                }
                
                // Page context
                if (window.ShopifyAnalytics?.meta?.page) {
                    const page = window.ShopifyAnalytics.meta.page;
                    shopifyData.page = {
                        pageType: page.pageType,
                        resourceId: page.resourceId,
                        resourceType: page.resourceType
                    };
                }
            }
            
            logInfo('Collected Shopify context data');
        } catch (error) {
            logError('Failed to collect Shopify data', error);
        }
        
        return shopifyData;
    }
    
    // Cart synchronization setup
    function setupCartSync(widget) {
        try {
            // Listen for cart updates
            if (window.Shopify) {
                // Override cart update callback
                const originalOnCartUpdate = window.Shopify.onCartUpdate;
                window.Shopify.onCartUpdate = function(cart) {
                    // Call original callback if it exists
                    if (originalOnCartUpdate) {
                        originalOnCartUpdate.call(this, cart);
                    }
                    
                    // Update widget with new cart data
                    if (widget && widget.updateMetadata) {
                        widget.updateMetadata({
                            cart: {
                                item_count: cart.item_count,
                                total_price: cart.total_price,
                                currency: window.Shopify.currency?.active || 'USD'
                            }
                        });
                        logInfo('Cart data synchronized');
                    }
                };
                
                // Listen for Ajax cart events (common in Shopify themes)
                document.addEventListener('cart:refresh', function(event) {
                    if (event.detail && widget && widget.updateMetadata) {
                        widget.updateMetadata({
                            cart: event.detail
                        });
                    }
                });
            }
        } catch (error) {
            logError('Failed to setup cart synchronization', error);
        }
    }
    
    // Widget container creation
    function createWidgetContainer(containerId) {
        let container = document.getElementById(containerId);
        
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.style.cssText = `
                position: fixed;
                z-index: 100000;
                pointer-events: none;
            `;
            document.body.appendChild(container);
            logInfo(`Created widget container: ${containerId}`);
        }
        
        return container;
    }
    
    // Main widget initialization
    async function initializeWidget() {
        try {
            // Validate agent token
            if (!agentToken) {
                logError('Agent token is required. Add data-agent-token attribute to script tag.');
                return;
            }
            
            logInfo(`Initializing widget v${SCRIPT_VERSION}`);
            
            // Load configuration
            const config = await loadConfiguration();
            
            // Collect Shopify-specific data
            const shopifyData = collectShopifyData();
            
            // Merge Shopify data into config
            if (Object.keys(shopifyData).length > 0) {
                config.metadata = { ...config.metadata, ...shopifyData };
            }
            
            // Create widget container
            createWidgetContainer(config.containerId);
            
            // Load ChatWidget script
            await loadChatWidgetScript();
            
            // Initialize ChatWidget
            const widget = new window.AgentmanChatWidget.ChatWidget(config);
            window.agentmanWidget = widget;
            
            // Setup Shopify-specific features
            if (config.shopifyIntegration.cartSync) {
                setupCartSync(widget);
            }
            
            // Dispatch initialization event
            document.dispatchEvent(new CustomEvent('agentman-shopify-initialized', {
                detail: { 
                    widget: widget,
                    config: config,
                    shopifyData: shopifyData
                }
            }));
            
            logInfo('Widget initialization complete');
            
        } catch (error) {
            logError('Widget initialization failed', error);
        }
    }
    
    // ChatWidget script loading with retry logic
    function loadChatWidgetScript() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.AgentmanChatWidget && window.AgentmanChatWidget.ChatWidget) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = WIDGET_CDN;
            script.async = true;
            
            script.onload = function() {
                // Wait for ChatWidget to be available
                let attempts = 0;
                const maxAttempts = 50; // 5 seconds max
                
                function checkWidget() {
                    if (window.AgentmanChatWidget && window.AgentmanChatWidget.ChatWidget) {
                        logInfo('ChatWidget script loaded successfully');
                        resolve();
                    } else if (attempts < maxAttempts) {
                        attempts++;
                        setTimeout(checkWidget, 100);
                    } else {
                        reject(new Error('ChatWidget not available after script load'));
                    }
                }
                
                checkWidget();
            };
            
            script.onerror = function() {
                reject(new Error('Failed to load ChatWidget script'));
            };
            
            document.head.appendChild(script);
        });
    }
    
    // DOM ready check
    function isDocumentReady() {
        return document.readyState === 'complete' || 
               (document.readyState !== 'loading' && !document.documentElement.doScroll);
    }
    
    // Start initialization
    function start() {
        if (isDocumentReady()) {
            initializeWidget();
        } else {
            document.addEventListener('DOMContentLoaded', initializeWidget);
        }
    }
    
    // Detect if we're in an iframe (some Shopify themes use iframes)
    if (window.self !== window.top) {
        logInfo('Detected iframe environment, adjusting initialization');
        // Additional iframe-specific logic if needed
    }
    
    // Start the initialization process
    start();
    
    // Export for debugging (development only)
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('ngrok')) {
        window.agentmanShopifyDebug = {
            version: SCRIPT_VERSION,
            config: defaultConfig,
            reinitialize: initializeWidget,
            collectShopifyData: collectShopifyData
        };
    }
    
})();