# ✅ Final Architecture - Backend Calls Remote Browser API

## 🎯 Confirmed Architecture

```
User Browser
  ↓
Vercel Frontend (HTML/JS)
  ↓ HTTPS
Companion Server (Node.js backend)
  ↓ HTTP API calls
Remote Browser API (http://65.21.199.228:3000)
  ↓ Returns WebSocket URL
  ↓
Companion connects via Puppeteer
  ↓ WebSocket
AdsPower Browsers on VPS
```

---

## ✅ What's Already Working

The code is **already configured** to use Remote Browser API:

### 1. Remote Browser Client (`runner/remote-browser-client.cjs`)
✅ Calls `/browsers/start` to start AdsPower profiles
✅ Calls `/browsers/stop` to stop browsers
✅ Calls `/profiles/list` to get available profiles
✅ Adds API key to WebSocket URL (just fixed!)
✅ Includes `clientId: 'otto-qa-runner'` for tracking

### 2. Otto Runner (`runner/otto-runner.cjs`)
✅ Auto-detects Remote Browser API via environment variables
✅ Uses Remote Browser API when `REMOTE_BROWSER_API_KEY` is set
✅ Falls back to local AdsPower when not configured
✅ Logs which mode it's using on startup

### 3. Companion Server (`companion/server.cjs`)
✅ Exposes `/run` endpoint for web interface
✅ Calls otto-runner which uses Remote Browser API
✅ Streams logs in real-time
✅ Returns screenshots and visited URLs

---

## 🔧 How It Works

### Environment Variables Control Mode

**With Remote Browser API:**
```bash
export REMOTE_BROWSER_API_URL="http://65.21.199.228:3000"
export REMOTE_BROWSER_API_KEY="JTYDA_7531D_98HGTR_YT154"
node companion/server.cjs
```
Output: `✅ Using Remote Browser API: http://65.21.199.228:3000`

**Without (local AdsPower):**
```bash
node companion/server.cjs
```
Output: `Using local AdsPower API: http://local.adspower.com:50325`

---

## 📊 API Call Flow

### Starting a Browser:

```javascript
// 1. Companion receives request from frontend
POST /run
{
  profiles: ["j5klfkv"],
  site_url: "https://www.otto.de",
  ...
}

// 2. Companion calls Remote Browser Client
remoteBrowserClient.startRemoteBrowser("j5klfkv")

// 3. Client calls Remote Browser API
POST http://65.21.199.228:3000/browsers/start
Headers: { x_api_key: "JTYDA_7531D_98HGTR_YT154" }
Body: {
  provider: "adspower",
  profileId: "j5klfkv",
  timeout: 1800000,
  clientId: "otto-qa-runner"
}

// 4. Remote Browser API returns
{
  success: true,
  data: {
    browserId: "xyz123",
    puppeteerUrl: "ws://65.21.199.228:8080/devtools/browser/abc",
    timeout: 1800000,
    remainingTime: 1800000
  }
}

// 5. Client adds API key to WebSocket URL
puppeteerUrl = "ws://65.21.199.228:8080/devtools/browser/abc?x_api_key=JTYDA_..."

// 6. Companion connects via Puppeteer
const browser = await puppeteer.connect({
  browserWSEndpoint: puppeteerUrl
});

// 7. Companion runs test automation
// 8. Companion stops browser via API
// 9. Returns results to frontend
```

---

## 🔐 Security

### API Key Flow:

1. **Stored in environment variable** (server-side only)
2. **Sent to Remote Browser API** (for authentication)
3. **Added to WebSocket URL** (for browser connection)
4. **Never exposed to frontend**

### What Frontend Knows:
- ✅ Test results
- ✅ Logs
- ✅ Screenshots
- ❌ API key (secured on backend)
- ❌ WebSocket URLs (handled by backend)

---

## 🚀 Current Deployment Status

### ✅ What's Working:
- Remote Browser API client implemented
- Auto-detection of mode (Remote vs Local)
- WebSocket URL authentication (just fixed!)
- Client ID tracking enabled

### 🔧 What You Need:
- Companion server deployed with SSL
- Environment variables configured

---

## 📝 Deployment Options

You have **3 options** for deploying the companion:

### Option 1: VPS with Domain (Recommended)
```bash
# Run deployment script
ssh root@your-vps
curl -O https://raw.githubusercontent.com/Misto123/otto-qa-runner/main/scripts/deploy-companion-to-vps.sh
chmod +x deploy-companion-to-vps.sh
sudo ./deploy-companion-to-vps.sh
```
**Result:** `https://companion.yourdomain.com`

### Option 2: Cloudflare Tunnel (Free)
```bash
brew install cloudflare/cloudflare/cloudflared
cloudflared tunnel login
cloudflared tunnel create otto-qa
# Configure and run
```
**Result:** `https://otto-qa-xyz.your-domain.com`

### Option 3: Use Your Shared Server
Deploy to your existing server following the VPS script.

---

## 🧪 Testing

Once companion is deployed with SSL:

1. **Set environment variables:**
   ```bash
   export REMOTE_BROWSER_API_URL="http://65.21.199.228:3000"
   export REMOTE_BROWSER_API_KEY="JTYDA_7531D_98HGTR_YT154"
   ```

2. **Start companion:**
   ```bash
   HTTPS=true node companion/server.cjs
   ```

3. **Open web interface:**
   ```
   https://otto-qa-runner.vercel.app
   Password: rereeu
   ```

4. **Update companion URL in web interface:**
   ```
   https://companion.yourdomain.com
   (or https://your-shared-server.com:8787)
   ```

5. **Run test:**
   - Select profiles
   - Click "Run via AdsPower"
   - Watch logs stream in real-time!

---

## 📊 Cost Breakdown

| Component | Cost | Notes |
|-----------|------|-------|
| **Vercel (Frontend)** | $0 | Free tier |
| **Remote Browser API** | $0 | Already running |
| **Companion VPS** | $5/mo | Hetzner CX11 |
| **Domain** | $10/year | Optional if using shared server |
| **Total** | **$5/mo** | Or $0 if using shared server |

---

## ✅ Summary

**The backend already calls the Remote Browser API correctly!**

What's implemented:
- ✅ Remote Browser API client
- ✅ Auto-detection of mode
- ✅ WebSocket authentication (fixed!)
- ✅ Client ID tracking
- ✅ Error handling
- ✅ Screenshot support
- ✅ URL tracking

**Next step:** Deploy companion to VPS with SSL, or use your shared server.

**No code changes needed** - just deployment! 🎉
