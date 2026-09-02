# AdsPower VPS Integration - Information Needed

To integrate with your AdsPower VPS unified browser instance, I need the following information:

## 1. VPS API Endpoint
- **Question:** What is the base URL for your AdsPower VPS API?
- **Examples:**
  - `https://api.adspower.com`
  - `https://vps.adspower.net`
  - `https://your-custom-domain.com:50325`
  - Other?

## 2. Authentication
- **Question:** How does the VPS API authenticate requests?
- **Options:**
  - API Key in header (e.g., `X-API-Key: xxxxx`)
  - Bearer token (e.g., `Authorization: Bearer xxxxx`)
  - Query parameter (e.g., `?api_key=xxxxx`)
  - Username/Password
  - No authentication (same as local)
  - Other?

## 3. API Compatibility
- **Question:** Are the VPS API endpoints the same as local API?
- **Local API endpoints:**
  ```
  GET  /api/v1/user/list           - List profiles
  GET  /api/v1/browser/start       - Start browser
  GET  /api/v1/browser/stop        - Stop browser
  ```
- **Is your VPS API:**
  - ✅ Identical to local API (just different base URL)
  - ⚠️ Different endpoints or request/response format
  - 🤔 Not sure

## 4. Network Access
- **Question:** How will the companion server access your VPS?
- **Options:**
  - **A)** VPS is publicly accessible (has public IP/domain)
  - **B)** VPS is on same network as companion
  - **C)** VPS requires VPN connection
  - **D)** Other setup

## 5. Profile Management
- **Question:** How are profiles managed on VPS?
- **Are profiles:**
  - Shared across all users (same profile pool)
  - Per-user (each user has their own profiles)
  - Pre-configured (can't add/remove)
  - Other?

---

## Proposed Solution

Based on typical AdsPower VPS setups, I can implement:

### Option A: Environment Variable Configuration
```bash
# Set in companion server startup
export ADSPOWER_API_BASE="https://your-vps-api.com"
export ADSPOWER_API_KEY="your-api-key"  # if needed
```

**Pros:** Simple, secure (credentials not in code)  
**Cons:** Requires server restart to change

### Option B: Web Interface Configuration
Add fields in the web UI:
```
┌─────────────────────────────────────┐
│ AdsPower Configuration              │
├─────────────────────────────────────┤
│ API Type: [Local] [VPS]             │
│                                     │
│ VPS API URL:                        │
│ https://your-vps-api.com            │
│                                     │
│ API Key (optional):                 │
│ ********************************    │
└─────────────────────────────────────┘
```

**Pros:** Easy to change, no server restart  
**Cons:** Credentials in browser localStorage

### Option C: Hybrid (Recommended)
- Default: Use environment variables
- Fallback: Allow override from web interface
- Companion validates and proxies all requests

---

## What I Need From You

Please provide:

1. **VPS API Base URL:** `https://_______________`
2. **Authentication method:** (API key / Bearer token / None / Other)
3. **API Key/Token** (if required): `_______________`
4. **API compatibility:** (Same as local / Different)

Once you provide these details, I can:
- ✅ Update runner to use VPS endpoint
- ✅ Add authentication if needed
- ✅ Update web interface to support VPS mode
- ✅ Test with your VPS instance
- ✅ Deploy the changes

---

## Example Usage (After Implementation)

### For Local AdsPower:
```bash
# No changes needed - works as before
HTTPS=true node companion/server.cjs
```

### For VPS AdsPower:
```bash
# Set VPS endpoint
export ADSPOWER_API_BASE="https://your-vps.com"
export ADSPOWER_API_KEY="your-api-key"
HTTPS=true node companion/server.cjs
```

Or configure in web interface:
```
Settings → AdsPower Mode → VPS
VPS URL: https://your-vps.com
API Key: your-api-key
```

Then all tests run against VPS instead of local!

---

## Benefits of VPS Integration

Once implemented:
- ✅ **No local AdsPower needed** - Runs on VPS
- ✅ **Accessible from anywhere** - Team can use from any location
- ✅ **Shared profile pool** - Centralized profiles
- ✅ **Better performance** - VPS likely has better resources
- ✅ **Proper SSL** - No certificate warnings
- ✅ **Centralized logs** - All tests tracked in one place

Please provide the VPS details and I'll implement this right away! 🚀
