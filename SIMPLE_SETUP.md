# Simple Companion Setup - 3 Steps

## 🎯 Quick Setup (From Any PC)

### Step 1: Find Your Mac's IP

**Option A - Via whoer.net (Easiest):**
1. On the Mac running companion, open: https://whoer.net
2. Copy the IP address shown (e.g., `192.168.1.159`)

**Option B - Via Terminal:**
1. On the Mac, open Terminal
2. Run: `ifconfig | grep "inet " | grep -v 127.0.0.1`
3. Copy the first IP (e.g., `192.168.1.159`)

### Step 2: Enter IP in Web UI

1. On your other PC, open: https://otto-qa-runner.vercel.app/
2. Find "Companion Server Setup" section
3. Paste the IP into "Mac IP Address" field
4. Watch the "Companion Server URL" auto-build!

### Step 3: Test Connection

1. Click: **🔌 Test Connection**
2. Accept security certificate warning (first time only)
3. See: ✅ Connected! Companion is ready
4. Done! Start testing

---

## ✅ That's It!

**3 simple steps:**
1. Get IP from whoer.net
2. Paste into web UI
3. Test connection

**No scanning. No timeouts. Just works!** 🚀

---

## 🔒 Security Certificate Warning

**First time only:** Browser will warn about self-signed certificate.

**Chrome/Edge:**
- Click "Advanced"
- Click "Proceed to [IP] (unsafe)"

**Firefox:**
- Click "Advanced"
- Click "Accept the Risk and Continue"

**Safari:**
- Click "Show Details"
- Click "Visit Website"

This is safe - it's your own local server!

---

## 🤔 Troubleshooting

### "Cannot connect"

**Check companion is running:**
```bash
ps aux | grep companion/server.cjs
```

**Restart if needed:**
```bash
cd /Users/northsea/ClaudeProjects/otto-qa-runner
export REMOTE_BROWSER_API_URL="http://65.21.199.228:3000"
export REMOTE_BROWSER_API_KEY="JTYDA_7531D_98HGTR_YT154"
HTTPS=true node companion/server.cjs > /tmp/companion.log 2>&1 &
```

### "Wrong IP?"

**Verify both devices on same network:**
- Your PC IP: Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Mac IP: Should start with same numbers (e.g., both `192.168.1.x`)

### "Still doesn't work?"

**Check firewall:**
- Mac: System Settings → Network → Firewall
- Allow port 8787

---

## 💡 Example

**Mac IP from whoer.net:** `192.168.1.159`

**Enter in web UI:** `192.168.1.159`

**Auto-generated URL:** `https://192.168.1.159:8787`

**Click Test Connection** → ✅ Connected!

**That's it!** 🎉

