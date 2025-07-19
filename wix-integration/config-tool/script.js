class WixConfigTool {
    constructor() {
        this.config = this.getDefaultConfig();
        this.initEventListeners();
        this.loadSavedConfig();
        this.updateUI();
    }

    getDefaultConfig() {
        return {
            // Required
            agentToken: '',
            containerId: 'agentman-chat-wix',
            
            // Widget behavior
            variant: 'corner',
            position: 'bottom-right',
            initialHeight: '600px',
            initialWidth: '400px',
            title: 'AI Assistant',
            placeholder: 'Ask me anything...',
            toggleText: 'Ask Agentman',
            initiallyOpen: false,
            enableWelcomeScreen: true,
            showFloatingPrompts: true,
            
            // Theme
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
            
            // Advanced
            persistence: {
                enabled: true,
                days: 7
            },
            apiUrl: '',
            enableAttachments: true
        };
    }

    initEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Variant change handler
        document.getElementById('variant').addEventListener('change', (e) => {
            this.togglePositionVisibility(e.target.value);
        });

        // Show/hide prompts section
        document.getElementById('showMessagePrompts').addEventListener('change', (e) => {
            document.getElementById('promptsSection').style.display = e.target.checked ? 'block' : 'none';
        });

        // Add prompt button
        document.getElementById('addPrompt').addEventListener('click', () => this.addPrompt());

        // Remove prompt handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-prompt')) {
                e.target.parentElement.remove();
            }
        });

        // Theme preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.applyThemePreset(e.target.dataset.preset));
        });

        // Auto-save on input change
        document.querySelectorAll('input, select, textarea').forEach(element => {
            element.addEventListener('change', () => this.saveConfig());
        });
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });
    }

    togglePositionVisibility(variant) {
        const positionGroup = document.getElementById('positionGroup');
        positionGroup.style.display = variant === 'corner' ? 'block' : 'none';
    }

    addPrompt() {
        const promptsList = document.getElementById('promptsList');
        const promptItem = document.createElement('div');
        promptItem.className = 'prompt-item';
        promptItem.innerHTML = `
            <input type="text" class="prompt-input" placeholder="Enter prompt text">
            <button class="remove-prompt">×</button>
        `;
        promptsList.appendChild(promptItem);
    }

    applyThemePreset(preset) {
        const presets = {
            default: {
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
            professional: {
                backgroundColor: '#1f2937',
                textColor: '#f9fafb',
                buttonColor: '#4f46e5',
                buttonTextColor: '#ffffff',
                agentForegroundColor: '#e5e7eb',
                userForegroundColor: '#818cf8',
                toggleBackgroundColor: '#4f46e5',
                toggleTextColor: '#ffffff',
                toggleIconColor: '#ffffff'
            },
            ecommerce: {
                backgroundColor: '#ffffff',
                textColor: '#064e3b',
                buttonColor: '#10b981',
                buttonTextColor: '#ffffff',
                agentForegroundColor: '#064e3b',
                userForegroundColor: '#059669',
                toggleBackgroundColor: '#10b981',
                toggleTextColor: '#ffffff',
                toggleIconColor: '#ffffff'
            },
            modern: {
                backgroundColor: '#faf5ff',
                textColor: '#581c87',
                buttonColor: '#9333ea',
                buttonTextColor: '#ffffff',
                agentForegroundColor: '#581c87',
                userForegroundColor: '#7c3aed',
                toggleBackgroundColor: '#9333ea',
                toggleTextColor: '#ffffff',
                toggleIconColor: '#ffffff'
            }
        };

        if (presets[preset]) {
            Object.entries(presets[preset]).forEach(([key, value]) => {
                const input = document.getElementById(key);
                if (input) {
                    input.value = value;
                }
            });
            this.showToast(`Applied ${preset} theme preset`);
        }
    }

    updateConfigFromForm() {
        // Basic settings
        this.config.agentToken = document.getElementById('agentToken').value;
        this.config.variant = document.getElementById('variant').value;
        this.config.position = document.getElementById('position').value;
        this.config.enableWelcomeScreen = document.getElementById('enableWelcomeScreen').checked;

        // Appearance
        this.config.theme.backgroundColor = document.getElementById('backgroundColor').value;
        this.config.theme.textColor = document.getElementById('textColor').value;
        this.config.theme.buttonColor = document.getElementById('buttonColor').value;
        this.config.theme.buttonTextColor = document.getElementById('buttonTextColor')?.value || '#ffffff';
        this.config.theme.agentForegroundColor = document.getElementById('agentForegroundColor').value;
        this.config.theme.userForegroundColor = document.getElementById('userForegroundColor').value;
        this.config.theme.toggleBackgroundColor = document.getElementById('toggleBackgroundColor').value;
        this.config.theme.toggleTextColor = document.getElementById('toggleTextColor').value;
        this.config.theme.toggleIconColor = document.getElementById('toggleIconColor').value;

        this.config.title = document.getElementById('title').value;
        this.config.toggleText = document.getElementById('toggleText').value;
        this.config.placeholder = document.getElementById('placeholder').value;

        // Content
        this.config.initialMessage = document.getElementById('initialMessage').value;
        this.config.messagePrompts.show = document.getElementById('showMessagePrompts').checked;
        this.config.messagePrompts.welcome_message = document.getElementById('welcomePromptMessage').value;
        
        // Collect prompts
        const prompts = [];
        document.querySelectorAll('.prompt-input').forEach(input => {
            if (input.value.trim()) {
                prompts.push(input.value.trim());
            }
        });
        this.config.messagePrompts.prompts = prompts;

        this.config.enableAttachments = document.getElementById('enableAttachments').checked;

        // Advanced
        this.config.initialWidth = document.getElementById('initialWidth').value;
        this.config.initialHeight = document.getElementById('initialHeight').value;
        this.config.persistence.enabled = document.getElementById('persistenceEnabled').checked;
        this.config.persistence.days = parseInt(document.getElementById('persistenceDays').value);
        this.config.apiUrl = document.getElementById('apiUrl').value;
        this.config.initiallyOpen = document.getElementById('initiallyOpen').checked;
        this.config.showFloatingPrompts = document.getElementById('showFloatingPrompts').checked;
    }

    generateCode() {
        this.updateConfigFromForm();
        
        if (!this.config.agentToken) {
            alert('Please enter your Agent Token');
            this.switchTab('basic');
            document.getElementById('agentToken').focus();
            return;
        }

        // Clean up config for output
        const outputConfig = { ...this.config };
        if (!outputConfig.apiUrl) {
            delete outputConfig.apiUrl;
        }

        const code = `<!-- Agentman Chat Widget for Wix -->
<div id="${this.config.containerId}" style="position: relative; z-index: 100000;"></div>

<script src="https://cdn.jsdelivr.net/npm/@agentman/chat-widget@latest/dist/index.js"></script>

<script>
(function() {
    // Wait for ChatWidget to load
    function initWidget() {
        if (typeof window.ChatWidget === 'undefined') {
            setTimeout(initWidget, 100);
            return;
        }
        
        // Configuration
        const config = ${JSON.stringify(outputConfig, null, 8).split('\n').map((line, i) => i === 0 ? line : '        ' + line).join('\n')};
        
        // Initialize widget
        try {
            const widget = new window.ChatWidget(config);
            console.log('Agentman Chat Widget initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Agentman Chat Widget:', error);
        }
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();
</script>

<!-- End Agentman Chat Widget -->`;

        document.getElementById('generated-code').value = code;
        this.saveConfig();
        this.showToast('Code generated successfully!');
    }

    updatePreview() {
        this.updateConfigFromForm();
        const previewFrame = document.getElementById('preview-frame');
        
        // Send config to preview frame
        previewFrame.contentWindow.postMessage({
            type: 'updateConfig',
            config: this.config
        }, '*');
        
        this.showToast('Preview updated!');
    }

    copyToClipboard() {
        const code = document.getElementById('generated-code');
        if (!code.value) {
            alert('Please generate code first');
            return;
        }
        
        code.select();
        document.execCommand('copy');
        this.showToast('Code copied to clipboard!');
    }

    downloadCode() {
        const code = document.getElementById('generated-code').value;
        if (!code) {
            alert('Please generate code first');
            return;
        }
        
        const blob = new Blob([code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'agentman-wix-widget.html';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Code downloaded!');
    }

    saveConfig() {
        this.updateConfigFromForm();
        localStorage.setItem('agentmanWixConfig', JSON.stringify(this.config));
    }

    loadSavedConfig() {
        const saved = localStorage.getItem('agentmanWixConfig');
        if (saved) {
            try {
                this.config = { ...this.getDefaultConfig(), ...JSON.parse(saved) };
            } catch (e) {
                console.error('Failed to load saved config:', e);
            }
        }
    }

    updateUI() {
        // Basic settings
        document.getElementById('agentToken').value = this.config.agentToken || '';
        document.getElementById('variant').value = this.config.variant;
        document.getElementById('position').value = this.config.position;
        document.getElementById('enableWelcomeScreen').checked = this.config.enableWelcomeScreen;

        // Appearance
        document.getElementById('backgroundColor').value = this.config.theme.backgroundColor;
        document.getElementById('textColor').value = this.config.theme.textColor;
        document.getElementById('buttonColor').value = this.config.theme.buttonColor;
        document.getElementById('agentForegroundColor').value = this.config.theme.agentForegroundColor;
        document.getElementById('userForegroundColor').value = this.config.theme.userForegroundColor;
        document.getElementById('toggleBackgroundColor').value = this.config.theme.toggleBackgroundColor;
        document.getElementById('toggleTextColor').value = this.config.theme.toggleTextColor;
        document.getElementById('toggleIconColor').value = this.config.theme.toggleIconColor;
        document.getElementById('title').value = this.config.title;
        document.getElementById('toggleText').value = this.config.toggleText;
        document.getElementById('placeholder').value = this.config.placeholder;

        // Content
        document.getElementById('initialMessage').value = this.config.initialMessage;
        document.getElementById('showMessagePrompts').checked = this.config.messagePrompts.show;
        document.getElementById('welcomePromptMessage').value = this.config.messagePrompts.welcome_message;
        document.getElementById('enableAttachments').checked = this.config.enableAttachments;

        // Update prompts list
        const promptsList = document.getElementById('promptsList');
        promptsList.innerHTML = '';
        this.config.messagePrompts.prompts.forEach(prompt => {
            const promptItem = document.createElement('div');
            promptItem.className = 'prompt-item';
            promptItem.innerHTML = `
                <input type="text" class="prompt-input" value="${this.escapeHtml(prompt)}">
                <button class="remove-prompt">×</button>
            `;
            promptsList.appendChild(promptItem);
        });

        // Advanced
        document.getElementById('initialWidth').value = this.config.initialWidth;
        document.getElementById('initialHeight').value = this.config.initialHeight;
        document.getElementById('persistenceEnabled').checked = this.config.persistence.enabled;
        document.getElementById('persistenceDays').value = this.config.persistence.days;
        document.getElementById('apiUrl').value = this.config.apiUrl || '';
        document.getElementById('initiallyOpen').checked = this.config.initiallyOpen;
        document.getElementById('showFloatingPrompts').checked = this.config.showFloatingPrompts;

        // Update visibility
        this.togglePositionVisibility(this.config.variant);
        document.getElementById('promptsSection').style.display = this.config.messagePrompts.show ? 'block' : 'none';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message) {
        // Remove existing toast
        const existing = document.querySelector('.toast');
        if (existing) {
            existing.remove();
        }

        // Create new toast
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.style.display = 'block', 10);
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.style.display = 'none';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.wixConfigTool = new WixConfigTool();
});

// Make functions globally available
function generateCode() {
    window.wixConfigTool.generateCode();
}

function updatePreview() {
    window.wixConfigTool.updatePreview();
}

function copyToClipboard() {
    window.wixConfigTool.copyToClipboard();
}

function downloadCode() {
    window.wixConfigTool.downloadCode();
}