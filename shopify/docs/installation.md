# Shopify Installation Guide

## Overview

This guide walks you through installing the Agentman ChatWidget on your Shopify store. The installation takes less than 5 minutes and provides your customers with an AI-powered shopping assistant.

## Before You Start

### What You'll Need

✅ **Agentman Agent Token** - Get yours from [Agentman Studio](https://studio.agentman.ai)  
✅ **Shopify Store Admin Access** - Ability to edit theme code  
✅ **5 minutes of time** - Quick and easy installation  

### What You'll Get

🎯 **AI Shopping Assistant** - Help customers find products and get answers  
🛒 **Cart Integration** - AI can see and help with cart contents  
📱 **Mobile Optimized** - Works perfectly on all devices  
🎨 **Fully Customizable** - Match your store's brand and colors  

## Installation Methods

### Method 1: Configuration Tool (Recommended)

Use our step-by-step configuration tool to customize your widget and generate installation code.

1. **Go to Configuration Tool**: [Configure Your Widget →](../config-tool/index.html)
2. **Enter Your Agent Token**: Paste your Agentman token
3. **Customize Appearance**: Choose colors, position, and style
4. **Configure Content**: Set messages and prompts
5. **Generate Code**: Get your personalized script tag
6. **Install in Shopify**: Follow the generated instructions

### Method 2: Quick Install

If you have your agent token and want to use default settings:

```html
<script src="https://cdn.agentman.ai/shopify/v1/widget.js" 
        data-agent-token="YOUR_AGENT_TOKEN_HERE"></script>
```

## Step-by-Step Installation

### Step 1: Access Your Theme Code

1. **Log into Shopify Admin**
   - Go to your Shopify admin dashboard
   - Navigate to **Online Store → Themes**

2. **Open Code Editor**
   - Find your current theme (usually marked as "Current theme")
   - Click **Actions → Edit code**

### Step 2: Locate theme.liquid File

1. **Find layout folder**
   - In the file browser on the left, look for the **layout** folder
   - Click to expand it

2. **Open theme.liquid**
   - Click on **theme.liquid** to open it
   - This is your main theme template file

### Step 3: Add the Script Tag

1. **Find the closing body tag**
   - Scroll down to the bottom of the file
   - Look for `</body>` (usually near the end)

2. **Add your script tag**
   - Paste your script tag just **before** the `</body>` tag
   - Make sure there's a line break before and after

   ```html
   <!-- Your existing theme code -->
   
   <!-- Agentman Chat Widget -->
   <script src="https://cdn.agentman.ai/shopify/v1/widget.js" 
           data-agent-token="YOUR_AGENT_TOKEN_HERE"></script>
   
   </body>
   </html>
   ```

3. **Save the file**
   - Click **Save** in the top right
   - Wait for the "Saved" confirmation

### Step 4: Test Your Installation

1. **Visit your store**
   - Go to your store's frontend (not the admin)
   - You should see the chat widget appear in the bottom-right corner

2. **Test the widget**
   - Click the chat button to open it
   - Try sending a test message
   - Verify it responds correctly

## Configuration Options

### Basic Configuration

You can configure the widget by adding data attributes to the script tag:

```html
<script src="https://cdn.agentman.ai/shopify/v1/widget.js" 
        data-agent-token="YOUR_TOKEN"
        data-variant="corner"
        data-position="bottom-right"
        data-title="Shopping Assistant">
</script>
```

### Available Attributes

| Attribute | Options | Default | Description |
|-----------|---------|---------|-------------|
| `data-agent-token` | Your token | Required | Your Agentman agent token |
| `data-variant` | `corner`, `inline`, `centered` | `corner` | Widget display style |
| `data-position` | `bottom-right`, `bottom-left`, `top-right`, `top-left` | `bottom-right` | Corner position |
| `data-title` | Any text | `AI Assistant` | Widget title |
| `data-config-id` | Config ID | None | Advanced configuration ID |

### Advanced Configuration

For advanced customization including colors, messages, and Shopify integration features, use the [Configuration Tool](../config-tool/index.html) to generate a custom setup.

## Shopify-Specific Features

### Customer Data Integration

When enabled, the widget automatically includes:
- Customer ID (for logged-in customers)
- Customer purchase history context
- Personalized responses based on customer data

### Cart Synchronization

The AI assistant can:
- See what's in the customer's cart
- Help with cart-related questions
- Suggest complementary products
- Assist with checkout issues

### Order Lookup

Customers can ask about:
- Order status and tracking
- Delivery estimates
- Return information
- Order history

## Theme Compatibility

### Supported Themes

✅ **All major Shopify themes including:**
- Dawn (Shopify's default theme)
- Debut, Brooklyn, Minimal
- Custom themes
- Most third-party themes

### CSS Isolation

The widget uses CSS isolation to prevent conflicts:
- No interference with your theme's styles
- High z-index ensures proper layering
- Mobile-responsive design

### Performance Impact

- **Minimal impact**: Loads asynchronously
- **Small footprint**: ~50KB compressed
- **CDN delivery**: Fast global loading
- **Cached loading**: Repeat visits load instantly

## Mobile Optimization

The widget is fully optimized for mobile:
- **Responsive design**: Adapts to all screen sizes
- **Touch-friendly**: Easy to use on mobile devices
- **Performance**: Optimized for mobile networks
- **Positioning**: Smart positioning on mobile screens

## Troubleshooting

### Widget Not Appearing

**Check these common issues:**

1. **Agent token**: Verify your token is correct
2. **Script placement**: Ensure script is before `</body>`
3. **File save**: Make sure you saved the theme.liquid file
4. **Browser cache**: Try refreshing or clearing cache

### Console Errors

**Check browser console (F12):**

1. **Look for errors**: Check for red error messages
2. **Network issues**: Verify script is loading from CDN
3. **Token validation**: Check for token-related errors

### Theme Conflicts

**If styling looks wrong:**

1. **Clear cache**: Clear browser and CDN cache
2. **CSS conflicts**: Try different positioning
3. **Z-index issues**: Widget may be behind other elements

### Performance Issues

**If page loading slowly:**

1. **Check network**: Verify CDN accessibility
2. **Script async**: Ensure asynchronous loading
3. **Multiple widgets**: Avoid installing multiple times

## Getting Help

### Support Resources

📧 **Email Support**: support@agentman.ai  
📖 **Documentation**: [Full documentation](../README.md)  
🐛 **Bug Reports**: Report issues with detailed description  
💬 **Feature Requests**: Contact us with suggestions  

### What to Include in Support Requests

When contacting support, please include:

1. **Store URL**: Your Shopify store URL
2. **Agent Token**: Your agent token (first/last 4 characters only)
3. **Browser**: Which browser and version you're using
4. **Error Messages**: Any console errors or error messages
5. **Screenshots**: Screenshots of the issue if visual

### Response Times

- **Critical Issues**: Within 4 hours
- **General Support**: Within 24 hours
- **Feature Requests**: Within 48 hours

## Advanced Topics

### Custom Configuration

For stores needing advanced customization:

1. **Use Configuration Tool**: Generate custom configs
2. **Config IDs**: Store configurations for reuse
3. **A/B Testing**: Test different configurations
4. **Analytics**: Track widget performance

### Multiple Store Management

For agencies managing multiple stores:

1. **Configuration Templates**: Reuse configurations
2. **Batch Deployment**: Install across multiple stores
3. **Centralized Management**: Manage all configurations
4. **White Label**: Custom branding options

### Integration with Shopify Apps

The widget integrates well with popular Shopify apps:

- **Review apps**: Include review data in responses
- **Inventory apps**: Real-time stock information
- **Shipping apps**: Accurate delivery estimates
- **Loyalty apps**: Include loyalty point information

## Best Practices

### Positioning

- **Bottom-right**: Most common and expected by users
- **Mobile consideration**: Ensure doesn't block important elements
- **Above fold**: Keep toggle button visible without scrolling

### Content

- **Clear prompts**: Use prompts relevant to your products
- **Brand voice**: Match your store's tone and style
- **Product focus**: Include product-related prompts

### Performance

- **Test regularly**: Check widget performance monthly
- **Monitor usage**: Track customer engagement
- **Update content**: Keep prompts and messages fresh

### Customer Experience

- **Fast responses**: Ensure your agent responds quickly
- **Accurate information**: Keep product data up to date
- **Escalation path**: Provide way to contact human support

## Frequently Asked Questions

### General

**Q: How much does this cost?**
A: Widget usage is included with your Agentman subscription. No additional fees.

**Q: Will this slow down my store?**
A: No, the widget loads asynchronously and has minimal performance impact.

**Q: Can I customize the appearance?**
A: Yes, fully customizable colors, positioning, and content via our configuration tool.

### Technical

**Q: Does this work with my theme?**
A: Yes, the widget is designed to work with all Shopify themes using CSS isolation.

**Q: Can I install on multiple stores?**
A: Yes, you can install on as many stores as your Agentman subscription allows.

**Q: Is customer data secure?**
A: Yes, we follow strict security protocols and only access data necessary for functionality.

### Features

**Q: Can customers ask about orders?**
A: Yes, when order lookup is enabled, customers can check order status and tracking.

**Q: Does it work on mobile?**
A: Yes, fully responsive and optimized for mobile devices.

**Q: Can I turn off certain features?**
A: Yes, all features can be enabled/disabled via configuration.

---

## Quick Reference

### Installation Checklist

- [ ] Got Agentman agent token
- [ ] Accessed Shopify theme code editor
- [ ] Found layout/theme.liquid file
- [ ] Added script tag before `</body>`
- [ ] Saved the file
- [ ] Tested on store frontend
- [ ] Verified widget appears and works
- [ ] Customized appearance (optional)

### Need Help?

- 🔧 **Configuration Tool**: [Configure Widget](../config-tool/index.html)
- 📖 **Full Documentation**: [Complete Guide](../README.md)
- 🆘 **Support**: support@agentman.ai

*Installation complete! Your customers now have access to AI-powered shopping assistance.* 🎉