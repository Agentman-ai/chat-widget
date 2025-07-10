# Shopify Troubleshooting Guide

## Quick Fixes

### Widget Not Appearing

**Most Common Issue: Script placement**

1. **Check script location**: Ensure script tag is placed just before `</body>` in `layout/theme.liquid`
2. **Verify agent token**: Make sure your agent token is correct and active
3. **Clear cache**: Clear browser cache and refresh the page
4. **Check theme**: Try on a different browser or incognito mode

**Quick Test:**
```html
<!-- This should be just before </body> -->
<script src="https://cdn.agentman.ai/shopify/v1/widget.js" 
        data-agent-token="YOUR_TOKEN_HERE"></script>
</body>
```

### Widget Appears But Doesn't Work

**Check these items:**

1. **Agent token validity**: Verify token is active in Agentman Studio
2. **Network connectivity**: Check if CDN is accessible
3. **Browser console**: Look for JavaScript errors (press F12)
4. **Shopify theme conflicts**: Try disabling other apps temporarily

## Common Issues

### 1. Installation Problems

#### Script Not Loading
**Symptoms**: No widget appears, no console errors
**Solutions**:
- Verify CDN URL is accessible: `https://cdn.agentman.ai/shopify/v1/widget.js`
- Check if firewall/ad blocker is blocking the script
- Try using the minified version: `widget.min.js`

#### Wrong File Location
**Symptoms**: Widget appears on some pages but not others
**Solutions**:
- Ensure script is in `layout/theme.liquid` (not in a specific template)
- Check if you have multiple theme.liquid files
- Verify you saved the correct file

#### Theme Update Overwrote Script
**Symptoms**: Widget stopped working after theme update
**Solutions**:
- Re-add the script tag to the new theme.liquid
- Create a backup of your theme customizations
- Consider using theme customization best practices

### 2. Display Issues

#### Widget Behind Other Elements
**Symptoms**: Widget is partially hidden or not clickable
**Solutions**:
```html
<!-- Add higher z-index -->
<script src="https://cdn.agentman.ai/shopify/v1/widget.js" 
        data-agent-token="YOUR_TOKEN"
        data-z-index="999999"></script>
```

#### Wrong Position on Mobile
**Symptoms**: Widget overlaps content on mobile devices
**Solutions**:
- Try different position: `data-position="bottom-left"`
- Use responsive positioning
- Check mobile preview in Shopify theme editor

#### Colors Don't Match Theme
**Symptoms**: Widget colors clash with store design
**Solutions**:
- Use the [Configuration Tool](../config-tool/index.html) to customize colors
- Extract colors from your theme CSS
- Use your brand colors consistently

### 3. Functionality Issues

#### Customer Data Not Working
**Symptoms**: Widget doesn't recognize logged-in customers
**Solutions**:
```html
<!-- Ensure customer data integration is enabled -->
<script src="https://cdn.agentman.ai/shopify/v1/widget.js" 
        data-agent-token="YOUR_TOKEN"
        data-customer-data="true"></script>
```

#### Cart Sync Not Working
**Symptoms**: AI doesn't see cart contents
**Solutions**:
- Verify cart sync is enabled in configuration
- Check if theme uses custom cart implementation
- Test with standard Shopify cart functionality

#### Messages Not Sending
**Symptoms**: User can type but messages don't send
**Solutions**:
- Check agent token validity
- Verify network connectivity
- Look for API errors in browser console
- Try with a fresh browser session

### 4. Performance Issues

#### Slow Page Loading
**Symptoms**: Store pages load slowly after installing widget
**Solutions**:
- Ensure script has `async` attribute (automatically added)
- Check for conflicts with other apps
- Use performance monitoring tools
- Consider lazy loading if needed

#### High Memory Usage
**Symptoms**: Browser becomes slow with widget open
**Solutions**:
- Clear conversation history: use incognito mode to test
- Update to latest widget version
- Check for memory leaks in browser developer tools

## Advanced Troubleshooting

### Browser Console Debugging

**How to check browser console:**
1. Press `F12` or right-click → "Inspect"
2. Go to "Console" tab
3. Refresh the page
4. Look for red error messages

**Common console errors and solutions:**

#### `ChatWidget is not defined`
**Cause**: Main widget script failed to load
**Solution**: Check CDN connectivity, try different browser

#### `Invalid agent token`
**Cause**: Token is incorrect or expired
**Solution**: Verify token in Agentman Studio, regenerate if needed

#### `CORS error`
**Cause**: Cross-origin request blocked
**Solution**: Usually resolves automatically, contact support if persistent

#### `Script load error`
**Cause**: Network or firewall blocking script
**Solution**: Check network connectivity, try different network

### Network Debugging

**Check script loading:**
1. Open browser developer tools (F12)
2. Go to "Network" tab
3. Refresh page
4. Look for `widget.js` in the list
5. Check if it loaded successfully (status 200)

**If script fails to load:**
- Try different browser
- Disable ad blockers
- Check corporate firewall settings
- Try mobile hotspot to test network

### Theme Compatibility

#### CSS Conflicts
**Symptoms**: Widget styling looks broken
**Solutions**:
```css
/* Add to theme CSS if needed */
#agentman-chat-shopify {
    all: initial !important;
    font-family: inherit !important;
}
```

#### JavaScript Conflicts
**Symptoms**: Widget functionality breaks
**Solutions**:
- Disable other apps one by one to identify conflict
- Check console for JavaScript errors
- Contact support with specific error messages

#### Theme Structure Issues
**Symptoms**: Widget appears in wrong location
**Solutions**:
- Try different variants: `data-variant="centered"`
- Use absolute positioning
- Contact theme developer for guidance

## Error Messages

### Common Error Messages and Solutions

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Agent token is required" | Missing or empty token | Add valid agent token |
| "Widget failed to initialize" | Script loading issue | Check browser console |
| "Network error" | Connectivity problem | Check internet connection |
| "Invalid configuration" | Malformed config | Use configuration tool |
| "Theme conflict detected" | CSS/JS conflict | Disable conflicting apps |

### API Errors

#### 401 Unauthorized
**Cause**: Invalid agent token
**Solution**: 
- Verify token in Agentman Studio
- Regenerate token if needed
- Update script tag with new token

#### 403 Forbidden
**Cause**: Token permissions issue
**Solution**:
- Check token permissions in Agentman Studio
- Ensure token is enabled for Shopify
- Contact support if problem persists

#### 429 Rate Limited
**Cause**: Too many requests
**Solution**:
- Wait before retrying
- Check if multiple instances are running
- Contact support to increase limits

#### 500 Server Error
**Cause**: Agentman service issue
**Solution**:
- Check [Agentman Status Page](https://status.agentman.ai)
- Try again in a few minutes
- Contact support if persistent

## Performance Optimization

### Loading Speed

**Optimize widget loading:**
1. **Use minified version**: `widget.min.js` instead of `widget.js`
2. **Preload script**: Add `<link rel="preload">` for faster loading
3. **Async loading**: Ensure script loads asynchronously (default)

### Memory Usage

**Reduce memory consumption:**
1. **Limit conversation history**: Set shorter persistence duration
2. **Close widget when not needed**: Minimize when possible
3. **Regular cleanup**: Clear old conversations periodically

### Bandwidth

**Minimize bandwidth usage:**
1. **Enable compression**: Use gzipped assets (automatic)
2. **Cache optimization**: Leverage CDN caching
3. **Lazy loading**: Load widget only when needed

## Testing Procedures

### Basic Functionality Test

1. **Load test page**: Visit store with widget installed
2. **Check appearance**: Verify widget appears in correct position
3. **Open widget**: Click to open chat interface
4. **Send message**: Type and send a test message
5. **Verify response**: Confirm AI responds appropriately
6. **Test features**: Try prompts, file uploads if enabled

### Cross-Browser Testing

**Test on multiple browsers:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Mobile Testing

**Test mobile functionality:**
- Open on mobile device
- Check positioning and sizing
- Test touch interactions
- Verify keyboard behavior
- Check landscape/portrait modes

### Theme Testing

**Test with different themes:**
- Switch to different Shopify themes
- Verify widget appearance
- Check for conflicts
- Test all functionality

## Shopify-Specific Issues

### App Conflicts

**Common conflicting apps:**
- Chat apps (remove other chat widgets)
- Cart drawer apps (may interfere with cart sync)
- Theme customization apps
- Page speed optimization apps

**Resolution steps:**
1. Disable other chat/popup apps
2. Test widget functionality
3. Re-enable apps one by one
4. Identify specific conflict
5. Contact app developers for compatibility

### Theme Updates

**Preventing widget loss during updates:**
1. **Document installation**: Keep record of changes made
2. **Backup theme**: Create backup before updates
3. **Test staging**: Use theme preview before publishing
4. **Re-install after update**: Add script again if needed

### Checkout Integration

**Widget on checkout pages:**
- Widget may not appear on checkout pages (Shopify limitation)
- This is normal behavior for security reasons
- Consider pre-checkout support options

### Multi-language Stores

**Handling multiple languages:**
- Widget content follows store's primary language
- Use configuration tool to set appropriate messages
- Consider language-specific prompts
- Contact support for advanced localization

## Getting Help

### Self-Service Resources

📖 **Documentation**: [Complete Guide](../README.md)  
🛠️ **Configuration Tool**: [Customize Widget](../config-tool/index.html)  
📋 **Installation Guide**: [Step-by-Step Instructions](installation.md)  

### Support Channels

📧 **Email Support**: support@agentman.ai  
🔗 **GitHub Issues**: Report technical issues  
💬 **Live Chat**: Available in Agentman Studio  

### When Contacting Support

**Include this information:**
1. **Store URL**: Your Shopify store URL
2. **Agent Token**: First and last 4 characters only
3. **Browser**: Browser name and version
4. **Device**: Desktop/mobile, operating system
5. **Error Message**: Exact error text or screenshot
6. **Steps to Reproduce**: What you did before the issue occurred
7. **Console Logs**: Any red errors from browser console

### Support Response Times

- **Critical Issues** (widget completely broken): 4 hours
- **High Priority** (functionality issues): 24 hours  
- **Medium Priority** (display issues): 48 hours
- **Low Priority** (feature requests): 1 week

## Prevention Tips

### Best Practices

1. **Regular Testing**: Test widget monthly
2. **Theme Backups**: Backup before major changes
3. **Update Monitoring**: Watch for theme updates
4. **Performance Checks**: Monitor page load speeds
5. **User Feedback**: Listen to customer feedback

### Monitoring

**Set up monitoring:**
- Google Analytics events for widget usage
- Page speed monitoring tools
- Regular functionality checks
- Customer feedback collection

### Maintenance

**Regular maintenance tasks:**
- Check widget functionality monthly
- Update configuration as needed
- Monitor performance metrics
- Clear old conversation data if needed

---

## Quick Reference

### Emergency Checklist

If widget stops working completely:

- [ ] Check agent token validity
- [ ] Verify script tag placement
- [ ] Test in incognito browser
- [ ] Check browser console for errors
- [ ] Try different browser/device
- [ ] Contact support with details

### Contact Information

🆘 **Emergency Support**: support@agentman.ai  
📞 **Phone Support**: Available for enterprise customers  
💬 **Live Chat**: In Agentman Studio dashboard  

*Most issues can be resolved quickly with proper troubleshooting steps.* 🔧