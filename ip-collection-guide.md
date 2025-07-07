# IP Address Collection Guide

## Overview

IP address collection in browser-based JavaScript requires special consideration since browsers cannot directly access the client's IP address for security reasons. This guide explains the different approaches available.

## Implementation Options

### 1. Client-Side Collection (Implemented)

The ChatAgent widget now supports optional IP address collection using external IP services:

```javascript
const widget = new ChatAgent({
  // ... other config
  collectClientMetadata: true,  // Enable metadata collection
  collectIPAddress: true        // Enable IP address collection
});
```

**How it works:**
- Makes requests to public IP services (ipify, ipapi.co, etc.)
- Fetches IP address and basic geolocation
- Adds data to client metadata sent with API requests

**Pros:**
- Easy to enable
- No backend changes required
- Includes basic geolocation

**Cons:**
- Requires external API calls
- May be blocked by ad blockers
- Adds latency (async collection)
- CORS limitations

### 2. Server-Side Collection (Recommended)

The most reliable approach is to have your backend API capture the IP address:

```python
# In your Agentman API endpoint
def agent_endpoint(request):
    # Get IP from request headers
    ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
    
    # Extract client metadata from request body
    client_metadata = request.json.get('client_metadata', {})
    
    # Add server-detected IP if not present
    if 'ip_address' not in client_metadata:
        client_metadata['ip_address'] = ip_address
```

**Pros:**
- Most reliable
- No external dependencies
- Works with all browsers
- Can detect proxy/VPN usage

**Cons:**
- Requires backend implementation

### 3. Hybrid Approach

Use server-side as primary with client-side as fallback:

```javascript
const widget = new ChatAgent({
  collectIPAddress: true,  // Try client-side collection
  clientMetadata: {
    // Backend will override with real IP if different
    ip_address: 'detected-by-server'
  }
});
```

## Privacy Considerations

### User Consent
Always inform users about IP collection:

```javascript
const widget = new ChatAgent({
  collectIPAddress: true,
  clientMetadata: {
    custom_tags: {
      consent_given: true,
      privacy_policy_version: '2.0'
    }
  }
});
```

### GDPR Compliance
- IP addresses are considered personal data
- Require explicit consent in EU
- Provide opt-out mechanism
- Document purpose of collection

### Configuration Options

```javascript
// Minimal collection (no IP)
const widget = new ChatAgent({
  collectClientMetadata: true,
  collectIPAddress: false
});

// With user-provided location
const widget = new ChatAgent({
  collectIPAddress: false,
  clientMetadata: {
    geo_location: 'San Francisco, CA, USA'  // User-provided
  }
});

// Full automatic collection
const widget = new ChatAgent({
  collectClientMetadata: true,
  collectIPAddress: true
});
```

## Security Notes

1. **HTTPS Required**: IP services require HTTPS
2. **CORS**: Some IP services may have CORS restrictions
3. **Rate Limiting**: Public IP services may rate limit
4. **Accuracy**: Client-detected IPs may differ from server-detected (proxies, VPNs)

## Testing

Use the provided test page to verify IP collection:

```bash
# Open test-client-metadata.html
# Check "Enable IP Collection" checkbox
# Monitor console for IP fetch attempts
```

## Recommended Setup

For production use:

1. **Default**: Server-side IP detection
2. **Optional**: Enable client-side for additional data
3. **Privacy**: Add consent mechanism
4. **Fallback**: Handle failures gracefully

```javascript
const widget = new ChatAgent({
  collectClientMetadata: true,
  collectIPAddress: userConsent.allowIPCollection || false,
  clientMetadata: {
    is_authenticated: user.isLoggedIn,
    user_id: user.id,
    custom_tags: {
      gdpr_consent: userConsent.timestamp
    }
  }
});
```