/**
 * Shopify Configuration Tool JavaScript
 * Handles the step-by-step configuration process and code generation
 */

class ShopifyConfigTool {
    constructor() {
        this.currentStep = 1;
        this.maxStep = 5;
        this.config = {};
        this.templates = {};
        this.previewOpen = false;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Shopify Config Tool');
        
        // Load templates
        await this.loadTemplates();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Initialize form state
        this.initFormState();
        
        // Update progress
        this.updateProgress();
        
        console.log('✅ Config tool initialized');
    }

    async loadTemplates() {
        // Template configurations
        this.templates = {
            default: {
                name: 'Default',
                description: 'General purpose assistant',
                config: {
                    title: 'AI Assistant',
                    toggleText: 'Ask Agentman',
                    initialMessage: 'Hello! How can I help you today?',
                    messagePrompts: {
                        show: true,
                        welcome_message: 'How can I help you today?',
                        prompts: [
                            'What can you do?',
                            'Help me get started',
                            'Tell me about your services'
                        ]
                    },
                    theme: {
                        buttonColor: '#2563eb',
                        backgroundColor: '#ffffff',
                        textColor: '#111827'
                    }
                }
            },
            ecommerce: {
                name: 'E-commerce',
                description: 'Sales & product support',
                config: {
                    title: 'Shopping Assistant',
                    toggleText: 'Need Help?',
                    initialMessage: 'Hi! I\'m here to help you find what you\'re looking for!',
                    messagePrompts: {
                        show: true,
                        welcome_message: 'What can I help you find today?',
                        prompts: [
                            'Product recommendations',
                            'Size guide',
                            'Shipping information'
                        ]
                    },
                    theme: {
                        buttonColor: '#059669',
                        backgroundColor: '#ffffff',
                        textColor: '#111827'
                    }
                }
            },
            support: {
                name: 'Support',
                description: 'Customer service focused',
                config: {
                    title: 'Customer Support',
                    toggleText: 'Get Support',
                    initialMessage: 'Hello! I\'m here to help with any questions or issues.',
                    messagePrompts: {
                        show: true,
                        welcome_message: 'How can I assist you today?',
                        prompts: [
                            'Track my order',
                            'Return policy',
                            'Contact information'
                        ]
                    },
                    theme: {
                        buttonColor: '#dc2626',
                        backgroundColor: '#ffffff',
                        textColor: '#111827'
                    }
                }
            }
        };
    }

    initEventListeners() {
        // Agent token validation
        const agentTokenInput = document.getElementById('agentToken');
        agentTokenInput.addEventListener('input', (e) => {
            this.validateAgentToken(e.target.value);
        });

        // Template selection
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectTemplate(e.currentTarget.dataset.template);
            });
        });

        // Variant change (show/hide position)
        document.getElementById('variant').addEventListener('change', (e) => {
            const positionGroup = document.getElementById('positionGroup');
            positionGroup.style.display = e.target.value === 'corner' ? 'block' : 'none';
        });

        // Show prompts toggle
        document.getElementById('showPrompts').addEventListener('change', (e) => {
            const promptsSection = document.getElementById('promptsSection');
            promptsSection.style.display = e.target.checked ? 'block' : 'none';
        });

        // Color picker updates
        document.querySelectorAll('input[type="color"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const valueSpan = e.target.parentElement.querySelector('.color-value');
                if (valueSpan) {
                    valueSpan.textContent = e.target.value.toLowerCase();
                }
                this.updatePreview();
            });
        });

        // Real-time preview updates
        document.querySelectorAll('input, textarea, select').forEach(element => {
            element.addEventListener('input', () => {
                this.updatePreview();
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.nextStep();
            } else if (e.key === 'Escape') {
                this.closePreview();
            }
        });
    }

    initFormState() {
        // Set default values
        this.selectTemplate('default');
        
        // Initialize color value displays
        document.querySelectorAll('input[type="color"]').forEach(input => {
            const valueSpan = input.parentElement.querySelector('.color-value');
            if (valueSpan) {
                valueSpan.textContent = input.value.toLowerCase();
            }
        });
    }

    validateAgentToken(token) {
        const nextBtn = document.getElementById('step1Next');
        const isValid = token && token.trim().length > 10; // Basic validation
        
        nextBtn.disabled = !isValid;
        
        if (isValid) {
            nextBtn.textContent = 'Next: Appearance →';
            this.showToast('✅ Agent token looks good!', 'success');
        } else {
            nextBtn.textContent = 'Enter agent token first';
        }
        
        return isValid;
    }

    selectTemplate(templateKey) {
        // Visual selection
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-template="${templateKey}"]`).classList.add('selected');

        // Apply template configuration
        const template = this.templates[templateKey];
        if (template) {
            this.applyTemplateConfig(template.config);
            console.log(`📋 Applied template: ${template.name}`);
        }
    }

    applyTemplateConfig(templateConfig) {
        // Apply basic settings
        if (templateConfig.title) {
            document.getElementById('title').value = templateConfig.title;
        }
        if (templateConfig.toggleText) {
            document.getElementById('toggleText').value = templateConfig.toggleText;
        }
        if (templateConfig.initialMessage) {
            document.getElementById('initialMessage').value = templateConfig.initialMessage;
        }

        // Apply theme colors
        if (templateConfig.theme) {
            Object.keys(templateConfig.theme).forEach(key => {
                const input = document.getElementById(key);
                if (input) {
                    input.value = templateConfig.theme[key];
                    // Update color value display
                    const valueSpan = input.parentElement.querySelector('.color-value');
                    if (valueSpan) {
                        valueSpan.textContent = templateConfig.theme[key].toLowerCase();
                    }
                }
            });
        }

        // Apply prompts
        if (templateConfig.messagePrompts) {
            const prompts = templateConfig.messagePrompts.prompts || [];
            prompts.forEach((prompt, index) => {
                const input = document.getElementById(`prompt${index + 1}`);
                if (input) {
                    input.value = prompt;
                }
            });
        }

        this.updatePreview();
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            this.saveCurrentStepData();
            
            if (this.currentStep < this.maxStep) {
                this.currentStep++;
                this.showStep(this.currentStep);
                this.updateProgress();
                
                // Auto-focus first input in new step
                setTimeout(() => {
                    const firstInput = document.querySelector('.config-section.active input, .config-section.active select');
                    if (firstInput && firstInput.type !== 'checkbox' && firstInput.type !== 'radio') {
                        firstInput.focus();
                    }
                }, 100);
            }
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateProgress();
        }
    }

    showStep(step) {
        // Hide all sections
        document.querySelectorAll('.config-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show current section
        document.querySelector(`[data-step="${step}"]`).classList.add('active');
        
        // Update step indicators
        document.querySelectorAll('.step').forEach((stepEl, index) => {
            stepEl.classList.remove('active', 'completed');
            if (index + 1 === step) {
                stepEl.classList.add('active');
            } else if (index + 1 < step) {
                stepEl.classList.add('completed');
            }
        });
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log(`📍 Moved to step ${step}`);
    }

    updateProgress() {
        const progressFill = document.querySelector('.progress-fill');
        const progress = ((this.currentStep - 1) / (this.maxStep - 1)) * 100;
        progressFill.style.width = `${progress}%`;
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                const token = document.getElementById('agentToken').value;
                if (!token || token.trim().length < 10) {
                    this.showToast('❌ Please enter a valid agent token', 'error');
                    return false;
                }
                return true;
            case 2:
            case 3:
            case 4:
                return true; // These steps have no strict validation
            default:
                return true;
        }
    }

    saveCurrentStepData() {
        // Save current step data to config object
        switch (this.currentStep) {
            case 1:
                this.config.agentToken = document.getElementById('agentToken').value;
                break;
            case 2:
                this.config.variant = document.getElementById('variant').value;
                this.config.position = document.querySelector('input[name="position"]:checked')?.value || 'bottom-right';
                this.config.theme = this.getThemeConfig();
                break;
            case 3:
                this.config.content = this.getContentConfig();
                break;
            case 4:
                this.config.advanced = this.getAdvancedConfig();
                break;
        }
    }

    getThemeConfig() {
        return {
            backgroundColor: document.getElementById('backgroundColor').value,
            textColor: document.getElementById('textColor').value,
            buttonColor: document.getElementById('buttonColor').value,
            buttonTextColor: '#ffffff',
            agentForegroundColor: document.getElementById('agentForegroundColor').value,
            userForegroundColor: document.getElementById('userForegroundColor').value,
            toggleBackgroundColor: document.getElementById('buttonColor').value, // Use button color for toggle
            toggleTextColor: '#ffffff',
            toggleIconColor: '#ffffff'
        };
    }

    getContentConfig() {
        const prompts = [];
        for (let i = 1; i <= 3; i++) {
            const prompt = document.getElementById(`prompt${i}`).value.trim();
            if (prompt) prompts.push(prompt);
        }

        return {
            title: document.getElementById('title').value,
            toggleText: document.getElementById('toggleText').value,
            placeholder: document.getElementById('placeholder').value,
            initialMessage: document.getElementById('initialMessage').value,
            messagePrompts: {
                show: document.getElementById('showPrompts').checked,
                welcome_message: 'How can I help you today?',
                prompts: prompts
            }
        };
    }

    getAdvancedConfig() {
        return {
            persistence: {
                enabled: document.getElementById('persistenceEnabled').checked,
                days: parseInt(document.getElementById('persistenceDays').value) || 7
            },
            initiallyOpen: document.getElementById('initiallyOpen').checked,
            shopifyIntegration: {
                customerData: document.getElementById('customerData').checked,
                cartSync: document.getElementById('cartSync').checked,
                orderLookup: document.getElementById('orderLookup').checked
            }
        };
    }

    generateInstallation() {
        this.saveCurrentStepData();
        
        // Build complete configuration
        const fullConfig = {
            agentToken: this.config.agentToken,
            apiUrl: 'https://run.agentman.ai',
            containerId: 'agentman-chat-shopify',
            variant: this.config.variant,
            position: this.config.position,
            title: this.config.content.title,
            placeholder: this.config.content.placeholder,
            toggleText: this.config.content.toggleText,
            initialMessage: this.config.content.initialMessage,
            initiallyOpen: this.config.advanced.initiallyOpen,
            theme: this.config.theme,
            messagePrompts: this.config.content.messagePrompts,
            persistence: this.config.advanced.persistence,
            shopifyIntegration: this.config.advanced.shopifyIntegration
        };

        // Generate script tag (Method 1)
        const scriptTag = `<script src="https://cdn.agentman.ai/shopify/v1/widget.js" data-agent-token="${this.config.agentToken}"></script>`;
        
        // Generate installation link (Method 2)
        const configData = btoa(JSON.stringify(fullConfig));
        const installLink = `https://install.agentman.ai/shopify?config=${configData}`;
        
        // Update UI
        document.getElementById('scriptTag').textContent = scriptTag;
        document.getElementById('installLink').textContent = installLink;
        
        // Store for download
        this.generatedConfig = fullConfig;
        
        // Move to final step
        this.currentStep = 5;
        this.showStep(5);
        this.updateProgress();
        
        console.log('🎉 Installation code generated!', fullConfig);
        this.showToast('🎉 Installation code generated successfully!', 'success');
    }

    copyScriptTag() {
        const scriptTag = document.getElementById('scriptTag').textContent;
        this.copyToClipboard(scriptTag, 'copyScriptBtn', '✅ Script tag copied!');
    }

    copyInstallLink() {
        const link = document.getElementById('installLink').textContent;
        this.copyToClipboard(link, 'copyLinkBtn', '✅ Installation link copied!');
    }

    async copyToClipboard(text, buttonId, successMessage) {
        try {
            await navigator.clipboard.writeText(text);
            
            // Update button temporarily
            const button = document.getElementById(buttonId);
            const originalText = button.textContent;
            button.textContent = '✅ Copied!';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
            
            this.showToast(successMessage, 'success');
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            this.showToast('❌ Failed to copy. Please select and copy manually.', 'error');
        }
    }

    downloadConfig() {
        if (!this.generatedConfig) {
            this.showToast('❌ No configuration to download', 'error');
            return;
        }

        const configJson = JSON.stringify(this.generatedConfig, null, 2);
        const blob = new Blob([configJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'agentman-shopify-config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('💾 Configuration downloaded!', 'success');
    }

    startOver() {
        this.currentStep = 1;
        this.config = {};
        this.generatedConfig = null;
        
        // Reset form
        document.getElementById('agentToken').value = '';
        this.selectTemplate('default');
        
        // Reset checkboxes to defaults
        document.getElementById('showPrompts').checked = true;
        document.getElementById('persistenceEnabled').checked = true;
        document.getElementById('customerData').checked = true;
        document.getElementById('cartSync').checked = true;
        document.getElementById('orderLookup').checked = true;
        document.getElementById('initiallyOpen').checked = false;
        
        // Reset other fields
        document.getElementById('persistenceDays').value = '7';
        
        this.showStep(1);
        this.updateProgress();
        this.validateAgentToken(''); // Reset validation
        
        this.showToast('🔄 Configuration reset', 'success');
    }

    // Preview functionality
    togglePreview() {
        const panel = document.getElementById('previewPanel');
        const fab = document.getElementById('previewFab');
        
        this.previewOpen = !this.previewOpen;
        
        if (this.previewOpen) {
            panel.classList.add('open');
            fab.style.display = 'none';
            this.updatePreview();
        } else {
            panel.classList.remove('open');
            fab.style.display = 'block';
        }
    }

    closePreview() {
        if (this.previewOpen) {
            this.togglePreview();
        }
    }

    updatePreview() {
        if (!this.previewOpen) return;
        
        // Get current configuration
        const currentConfig = this.getCurrentConfig();
        
        // Send to preview iframe
        const previewFrame = document.getElementById('previewFrame');
        if (previewFrame.contentWindow) {
            previewFrame.contentWindow.postMessage({
                type: 'updateConfig',
                config: currentConfig
            }, '*');
        }
    }

    getCurrentConfig() {
        // Build config from current form state
        return {
            agentToken: document.getElementById('agentToken')?.value || 'demo-token',
            variant: document.getElementById('variant')?.value || 'corner',
            position: document.querySelector('input[name="position"]:checked')?.value || 'bottom-right',
            title: document.getElementById('title')?.value || 'AI Assistant',
            theme: {
                backgroundColor: document.getElementById('backgroundColor')?.value || '#ffffff',
                textColor: document.getElementById('textColor')?.value || '#111827',
                buttonColor: document.getElementById('buttonColor')?.value || '#2563eb',
                agentForegroundColor: document.getElementById('agentForegroundColor')?.value || '#111827',
                userForegroundColor: document.getElementById('userForegroundColor')?.value || '#2563eb'
            }
        };
    }

    // Toast notifications
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.remove();
        }, 4000);
        
        console.log(`🔔 Toast: ${message}`);
    }
}

// Global functions for onclick handlers
function nextStep() { 
    window.shopifyConfig.nextStep(); 
}

function prevStep() { 
    window.shopifyConfig.prevStep(); 
}

function generateInstallation() { 
    window.shopifyConfig.generateInstallation(); 
}

function copyScriptTag() { 
    window.shopifyConfig.copyScriptTag(); 
}

function copyInstallLink() { 
    window.shopifyConfig.copyInstallLink(); 
}

function downloadConfig() { 
    window.shopifyConfig.downloadConfig(); 
}

function startOver() { 
    window.shopifyConfig.startOver(); 
}

function togglePreview() { 
    window.shopifyConfig.togglePreview(); 
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.shopifyConfig = new ShopifyConfigTool();
});