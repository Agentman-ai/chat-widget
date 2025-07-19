# Wix Installation Guide

## Prerequisites
- Wix website with a paid plan (required for Custom Code)
- Agentman agent token from your dashboard
- Access to Wix site settings

## Step-by-Step Installation

### 1. Get Your Agent Token
- Log into your Agentman dashboard
- Navigate to your agent settings
- Copy the agent token

### 2. Prepare the Code
1. Open `wix-embed-code.html`
2. Replace `YOUR_AGENT_TOKEN_HERE` with your actual token
3. Customize any settings as needed

### 3. Add to Wix

#### Using Custom Code (Recommended)
1. Go to your Wix Dashboard
2. Navigate to **Settings → Custom Code**
3. Click **"+ Add Custom Code"**
4. Configure:
   - **Name**: Agentman Chat Widget
   - **Add Code to Pages**: All pages
   - **Place Code in**: Body - end
5. Paste the entire code from `wix-embed-code.html`
6. Click **Apply**

#### Alternative: Using HTML iframe
1. In Wix Editor, click **Add Elements**
2. Go to **Embed & Social → Embed Code**
3. Choose **HTML iframe**
4. Paste the code
5. Click **Apply**

### 4. Publish Your Site
- Click **Publish** in the Wix Editor
- Visit your live site to see the widget

## Customization Options

### Message Prompts
```javascript
messagePrompts: {
    show: true,
    welcome_message: 'What can I help you with?',
    prompts: [
        'Your custom prompt 1',
        'Your custom prompt 2',
        'Your custom prompt 3'
    ]
}
```

### Theme Colors
```javascript
theme: {
    backgroundColor: '#ffffff',    // Widget background
    textColor: '#111827',         // Main text
    buttonColor: '#2563eb',       // Send button
    buttonTextColor: '#ffffff',   // Button text
    toggleBackgroundColor: '#2563eb', // Floating button
    toggleTextColor: '#ffffff'    // Floating button text
}
```

### Widget Behavior
```javascript
variant: 'corner',           // 'corner', 'centered', or 'inline'
position: 'bottom-right',    // Position of floating button
enableWelcomeScreen: true,   // Show welcome screen
enableAttachments: true      // Allow file uploads
```

## Verification

After publishing, check:
1. Widget appears in bottom-right corner
2. Clicking opens the chat interface
3. Messages send and receive properly
4. Theme matches your customization

## Common Issues

### Widget Not Appearing
- Verify Custom Code is enabled and active
- Check browser console for errors
- Ensure agent token is correct
- Try clearing browser cache

### Styling Conflicts
- The widget uses high z-index (999999)
- If covered by other elements, check Wix layer settings
- May need to adjust widget container z-index

### Console Errors
- "API URL is required" - Ensure apiUrl parameter is included
- "Agent token is required" - Check token is properly set
- "ChatWidget is not a constructor" - Use the correct path: `window.AgentmanChatWidget.ChatWidget`

## Support
For additional help:
- Check browser console for detailed error messages
- Review the README.md for technical details
- Contact Agentman support with your agent token and error messages