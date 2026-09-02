# Remote Browser API Setup Guide

## Overview

The Otto QA Runner now supports **Remote Browser API** for AdsPower VPS, eliminating the need for local AdsPower installation.

## Quick Setup

### 1. Get API Key

Get your API key from **1Password** under **"Rebel Cloud Browser api"**

### 2. Configure Environment Variables

```bash
# Add to your shell profile (~/.zshrc or ~/.bash_profile)
export REMOTE_BROWSER_API_URL="http://95.217.224.154:3000"
export REMOTE_BROWSER_API_KEY="your-api-key-from-1password"
```

Or set them temporarily:

```bash
export REMOTE_BROWSER_API_URL="http://95.217.224.154:3000"
export REMOTE_BROWSER_API_KEY="your-api-key"
```

### 3. Update Auto-Start Script (if using)

Edit `scripts/start-all.sh` and add the environment variables:

```bash
#!/bin/bash

# Remote Browser API Configuration
export REMOTE_BROWSER_API_URL="http://95.217.224.154:3000"
export REMOTE_BROWSER_API_KEY="your-api-key"

# Rest of script...
cd "$PROJECT_DIR"
HTTPS=true nohup node companion/server.cjs > "$LOG_DIR/companion.log" 2>&1 &
```

### 4. Update LaunchAgent (if using auto-start)

Edit `scripts/com.otto.qa-runner.plist` and add environment variables:

```xml
<key>EnvironmentVariables</key>
<dict>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>HTTPS</key>
    <string>true</string>
    <key>REMOTE_BROWSER_API_URL</key>
    <string>http://95.217.224.154:3000</string>
    <key>REMOTE_BROWSER_API_KEY</key>
    <string>your-api-key</string>
</dict>
```

Then reload:
```bash
launchctl unload ~/Library/LaunchAgents/com.otto.qa-runner.plist
launchctl load ~/Library/LaunchAgents/com.otto.qa-runner.plist
```

### 5. Start Companion

```bash
cd /Users/northsea/ClaudeProjects/otto-qa-runner
HTTPS=true node companion/server.cjs
```

You should see:
```
✅ Using Remote Browser API: http://95.217.224.154:3000
✅ Companion listening on https://0.0.0.0:8787
```

### 6. Test

Open https://otto-qa-runner.vercel.app and run a test!

---

## How It Works

### Mode Detection

The system **automatically detects** which mode to use:

```
IF REMOTE_BROWSER_API_KEY is set:
  → Use Remote Browser API (AdsPower VPS)
ELSE:
  → Use local AdsPower (localhost:50325)
```

### Remote Mode (VPS)
```
Web UI → Companion → Remote Browser API → AdsPower VPS → Browser
```

**Advantages:**
- ✅ No local AdsPower needed
- ✅ Work from anywhere
- ✅ Shared profile pool
- ✅ Professional API
- ✅ Auto-timeout management
- ✅ Screenshots included
- ✅ Session tracking

### Local Mode (Fallback)
```
Web UI → Companion → AdsPower Local → Browser
```

**Requires:**
- AdsPower installed and running locally
- Profiles managed locally

---

## Verification

### Check Mode
```bash
# Start companion and check logs
HTTPS=true node companion/server.cjs

# Should see:
✅ Using Remote Browser API: http://95.217.224.154:3000
# OR
Using local AdsPower API: http://local.adspower.com:50325
```

### Test API Connection

```bash
curl "http://95.217.224.154:3000/browsers/status" \
  -H "x_api_key: your-api-key"
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "name": "adspower",
        "status": "OK",
        "apiUrl": "..."
      }
    ]
  }
}
```

### Test Profile Listing

```bash
curl "http://95.217.224.154:3000/profiles/list?provider=adspower&page=1&pageSize=200" \
  -H "x_api_key: your-api-key" | jq '.data.profiles | length'
```

Should return number of available profiles (e.g., 200).

---

## Benefits of Remote Browser API

### For Team Members
- No local AdsPower installation
- No local profile management
- Work from any location
- Access to full profile pool

### For Operations
- Centralized browser management
- Unified profile pool (no sync issues)
- Better performance (VPS resources)
- Professional API with auth
- Session tracking and screenshots
- Auto-timeout prevents zombie browsers

### For Development
- Consistent environment across team
- No "works on my machine" issues
- Easier onboarding (no local setup)
- Better debugging (centralized logs)

---

## Switching Between Modes

### Use Remote Browser API
```bash
export REMOTE_BROWSER_API_KEY="your-api-key"
HTTPS=true node companion/server.cjs
```

### Use Local AdsPower
```bash
unset REMOTE_BROWSER_API_KEY
HTTPS=true node companion/server.cjs
```

---

## Troubleshooting

### "Remote Browser API: Connection failed"

**Check:**
1. Is `REMOTE_BROWSER_API_KEY` set?
   ```bash
   echo $REMOTE_BROWSER_API_KEY
   ```

2. Can you reach the API?
   ```bash
   curl http://95.217.224.154:3000/browsers/status \
     -H "x_api_key: your-api-key"
   ```

3. Is the API key valid?
   - Get fresh key from 1Password
   - Check for typos or extra spaces

### "AdsPower not available"

API returned `status !== 'OK'` for AdsPower provider.

**Fix:**
- Contact Remote Browser API admin
- Check if AdsPower VPS is running

### Companion still using local mode

**Check:**
```bash
# Is the environment variable set?
echo $REMOTE_BROWSER_API_KEY

# Restart companion
pkill -f companion/server.cjs
HTTPS=true node companion/server.cjs
```

### LaunchAgent not picking up environment variables

```bash
# Edit plist file
nano ~/Library/LaunchAgents/com.otto.qa-runner.plist

# Add environment variables (see step 4 above)

# Reload
launchctl unload ~/Library/LaunchAgents/com.otto.qa-runner.plist
launchctl load ~/Library/LaunchAgents/com.otto.qa-runner.plist
```

---

## Security Notes

### API Key Storage

**Recommended:**
- Store in environment variables
- Never commit to git
- Use `.env` file (gitignored)
- Or use macOS Keychain

**Example `.env` file:**
```bash
# .env (add to .gitignore)
REMOTE_BROWSER_API_URL=http://95.217.224.154:3000
REMOTE_BROWSER_API_KEY=your-api-key
```

Load with:
```bash
source .env
HTTPS=true node companion/server.cjs
```

### Network Security

The Remote Browser API uses:
- API key authentication (header or query param)
- Client ID tracking (optional)
- Request validation
- Rate limiting (API side)

---

## Complete Example

### Installation from Scratch

```bash
# 1. Clone repo
git clone https://github.com/Misto123/otto-qa-runner.git
cd otto-qa-runner

# 2. Install dependencies
npm install

# 3. Get API key from 1Password
# Copy "Rebel Cloud Browser api" key

# 4. Create .env file
cat > .env << 'EOF'
REMOTE_BROWSER_API_URL=http://95.217.224.154:3000
REMOTE_BROWSER_API_KEY=paste-your-key-here
EOF

# 5. Start companion
source .env
HTTPS=true node companion/server.cjs

# 6. Open web interface
# https://otto-qa-runner.vercel.app
# Password: rereeu
```

### Run Test

```bash
# 1. Open: https://otto-qa-runner.vercel.app
# 2. Password: rereeu
# 3. Select profiles (from Remote Browser API)
# 4. Configure test
# 5. Click "Run via AdsPower"
# 6. Watch live logs
# 7. Test completes
# 8. Browser auto-closed on Remote Browser API
```

---

## API Reference

See full documentation: [REMOTE_BROWSER_API.md](./REMOTE_BROWSER_API.md)

**Key Endpoints:**
- `GET /browsers/status` - Check API health
- `POST /browsers/start` - Start browser profile
- `POST /browsers/stop` - Stop browser and get session data
- `GET /profiles/list` - List available profiles

---

## Support

**API Key:** 1Password → "Rebel Cloud Browser api"  
**API Docs:** [GitHub - REBEL-Internet/remote-browser](https://github.com/REBEL-Internet/remote-browser)  
**API URL:** http://95.217.224.154:3000  

For issues with Remote Browser API, contact the API administrator.

---

## Summary

✅ **Zero local setup** - No AdsPower installation needed  
✅ **Automatic detection** - Set API key, it works  
✅ **Fallback support** - Still works with local AdsPower  
✅ **Team-ready** - Everyone uses same profile pool  
✅ **Professional** - Proper auth, tracking, screenshots  

Just set `REMOTE_BROWSER_API_KEY` and you're good to go! 🚀
