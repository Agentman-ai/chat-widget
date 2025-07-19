# Agentman Chat Widget - Wix Integration

## Quick Start

1. Copy the code from `wix-embed-code.html`
2. Replace `YOUR_AGENT_TOKEN_HERE` with your actual agent token
3. In Wix, go to **Settings → Custom Code**
4. Click **"+ Add Custom Code"**
5. Paste the code, set to "All pages" and "Body - end"
6. Click Apply and Publish

## File Structure

```
wix-integration-clean/
├── README.md                    # This file
├── wix-embed-code.html         # The embed code template
├── installation-guide.md       # Detailed installation steps
└── config-tool/                # Optional configuration tool
    ├── index.html
    ├── script.js
    └── styles.css
```

## Key Requirements

- **Agent Token**: Required from Agentman dashboard
- **API URL**: Always use `https://studio-api.agentman.ai`
- **Wix Plan**: Custom Code requires a paid Wix plan

## Customization

Edit the configuration in `wix-embed-code.html`:

- `title`: Widget header title
- `toggleText`: Floating button text
- `placeholder`: Input field placeholder
- `messagePrompts.prompts`: Quick action buttons
- `theme`: Colors for all UI elements

## Troubleshooting

If the widget doesn't appear:
1. Check browser console for errors (F12)
2. Verify the agent token is correct
3. Ensure code is placed in "Body - end"
4. Try a hard refresh (Ctrl+F5)

## Technical Notes

- The widget is loaded from npm CDN
- It's exported as `window.AgentmanChatWidget.ChatWidget`
- Requires both `agentToken` and `apiUrl` parameters
- Creates its own DOM elements (no container needed)