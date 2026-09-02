# Remote Browser API Integration

## Overview

Integrating with REBEL Internet Remote Browser API instead of local AdsPower installation.

**API Endpoint:** `http://95.217.224.154:3000`  
**Authentication:** API key from 1Password ("Rebel Cloud Browser api")  
**Provider:** `adspower` (VPS unified browser instance)

## Architecture Change

### Before (Local):
```
Web UI → Companion → AdsPower Local (localhost:50325) → Browser
```

### After (Remote Browser API):
```
Web UI → Companion → Remote Browser API (95.217.224.154:3000) → AdsPower VPS → Browser
```

## Implementation Plan

### 1. Replace AdsPower Client with Remote Browser API Client
- Remove direct AdsPower API calls
- Use Remote Browser API endpoints
- Handle authentication with API key

### 2. Update Runner to Use Remote Browser API
- `/browsers/start` - Start AdsPower profile
- `/browsers/stop` - Stop and get session data
- `/profiles/list` - Get available profiles

### 3. Update Web Interface
- Fetch profiles from Remote Browser API
- Display 200+ profiles from VPS
- No more local AdsPower dependency

### 4. Benefits
✅ No local AdsPower installation needed  
✅ Team can work from anywhere  
✅ Unified browser instance on VPS  
✅ Professional API with proper authentication  
✅ Screenshots and session tracking built-in  
✅ Auto-timeout management  

## API Usage Examples

### Start Browser
```javascript
const response = await fetch('http://95.217.224.154:3000/browsers/start', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x_api_key': API_KEY
    },
    body: JSON.stringify({
        provider: 'adspower',
        profileId: 'k1fgmwtq',  // AdsPower profile ID
        timeout: 1800000  // 30 minutes
    })
});

const { success, data } = await response.json();
// data.puppeteerUrl - WebSocket URL for Puppeteer
// data.browserId - Use this to stop browser
```

### Stop Browser
```javascript
const response = await fetch('http://95.217.224.154:3000/browsers/stop', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x_api_key': API_KEY
    },
    body: JSON.stringify({
        provider: 'adspower',
        browserId: browserId
    })
});

const { success, data } = await response.json();
// data.screenshots - Array of screenshots taken
// data.urls - Array of visited URLs
```

### List Profiles
```javascript
const response = await fetch(
    'http://95.217.224.154:3000/profiles/list?provider=adspower&page=1&pageSize=200',
    {
        headers: {
            'x_api_key': API_KEY
        }
    }
);

const { success, data } = await response.json();
// data.profiles - Array of available profiles
// data.total - Total number of profiles
```

## Environment Variables

```bash
# Remote Browser API Configuration
REMOTE_BROWSER_API_URL=http://95.217.224.154:3000
REMOTE_BROWSER_API_KEY=your-api-key-from-1password
```

## Next Steps

1. Get API key from 1Password ("Rebel Cloud Browser api")
2. Update runner to use Remote Browser API
3. Remove local AdsPower dependency
4. Update web interface to fetch profiles from API
5. Test end-to-end with VPS profiles
6. Deploy
