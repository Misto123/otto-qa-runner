# Otto QA Runner - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Start Companion Server

```bash
cd /Users/northsea/ClaudeProjects/otto-qa-runner

export REMOTE_BROWSER_API_URL="http://65.21.199.228:3000"
export REMOTE_BROWSER_API_KEY="JTYDA_7531D_98HGTR_YT154"

HTTPS=true node companion/server.cjs > /tmp/companion.log 2>&1 &
```

**Check if running:**
```bash
ps aux | grep companion/server.cjs
curl -k https://192.168.1.159:8787/health
```

### Step 2: Open Web UI

**Main Dashboard:**
https://otto-qa-runner.vercel.app/

**Registration Page:**
https://otto-qa-runner.vercel.app/register.html

### Step 3: Configure Companion URL

⚠️ **IMPORTANT:** Do NOT use `127.0.0.1`

✅ **Use network IP instead:**
```
https://192.168.1.159:8787
```

**Why?** Browser security blocks localhost connections from HTTPS sites.

---

## 🎯 Common Tasks

### Manual Login

1. Open: https://otto-qa-runner.vercel.app/
2. Enter companion URL: `https://192.168.1.159:8787`
3. Click: "🔌 Test Connection" (accept cert warning)
4. Select provider: BAS or AdsPower
5. Select profile: e.g., 42014 (BAS)
6. Click: "Login to Otto.de"
7. Log in manually in opened browser
8. Click: "✓ I'm Logged In"

### Bulk Registration

1. Open: https://otto-qa-runner.vercel.app/register.html
2. Enter companion URL: `https://192.168.1.159:8787`
3. Click: "🎲 Generate Data" (generates test accounts)
4. Review generated data
5. Click: "💾 Save Accounts"
6. Bind profiles (optional)
7. Click: "🚀 Start Registration"

### Import Existing Accounts

**From CSV:**
```bash
./scripts/import-accounts.sh accounts.csv
```

**From JSON:**
```bash
node scripts/parse-accounts.cjs accounts.json
```

**From clipboard:**
```bash
# Copy data to clipboard, then:
node scripts/parse-accounts.cjs --clipboard
```

---

## 🔧 Troubleshooting

### "Connection Lost" Error

**Cause:** Using `127.0.0.1` instead of network IP

**Fix:** Change companion URL to:
```
https://192.168.1.159:8787
```

### "Failed to fetch" Error

**Causes:**
1. Companion not running
2. Self-signed cert not accepted
3. Wrong URL

**Fix:**
```bash
# Check if running
ps aux | grep companion

# If not running, start it:
export REMOTE_BROWSER_API_URL="http://65.21.199.228:3000"
export REMOTE_BROWSER_API_KEY="JTYDA_7531D_98HGTR_YT154"
HTTPS=true node companion/server.cjs > /tmp/companion.log 2>&1 &

# Test connection
curl -k https://192.168.1.159:8787/health
```

### Self-Signed Certificate Warning

**This is normal!** Click:
1. "Advanced"
2. "Proceed anyway" or "Accept Risk"

This is safe - it's your local server.

### Check Logs

```bash
tail -f /tmp/companion.log
```

---

## 📊 System Status

### Available URLs

| Service | URL | Notes |
|---------|-----|-------|
| Web UI | https://otto-qa-runner.vercel.app/ | Main dashboard |
| Registration | https://otto-qa-runner.vercel.app/register.html | Bulk registration |
| Companion API | https://192.168.1.159:8787 | Local server (use this!) |
| Alternative | https://192.168.1.146:8787 | Backup IP |
| VPN/Tailscale | https://100.123.218.77:8787 | Remote access |

### Available Profiles

| Provider | Total Profiles | Test Profile | Speed |
|----------|----------------|--------------|-------|
| BAS | 6,003 | 42014 | ~13-20s |
| AdsPower | 200 | Various | ~20s |

### API Endpoints

```
GET  /health                 → Server health check
POST /login/start           → Start manual login
POST /login/complete        → Confirm login complete
GET  /login/status          → Check login status
GET  /login/profiles        → List profiles
POST /login/clear           → Clear session
POST /register/otto         → Start Otto registration
POST /api/save-accounts     → Save account data
GET  /api/load-accounts     → Load saved accounts
POST /api/update-account    → Update account
```

---

## 📁 File Locations

### Data Storage
```
data/registered-accounts.json    → Saved accounts
data/login-sessions.json         → Active sessions
```

### Logs
```
/tmp/companion.log               → Companion server logs
```

### Scripts
```
scripts/import-accounts.sh       → Import CSV/JSON
scripts/parse-accounts.cjs       → Parse various formats
scripts/test-bas-second-launch.cjs → BAS testing
```

---

## 🎓 Tips

1. **Always use network IP** (`192.168.1.159:8787`), never `127.0.0.1`
2. **Accept the cert warning** - it's your local server, it's safe
3. **Check logs** if something fails: `tail -f /tmp/companion.log`
4. **Test connection first** before running tests (🔌 Test Connection button)
5. **Bind profiles before registration** for faster automation
6. **Save accounts frequently** to avoid data loss

---

## 🚨 Common Mistakes

❌ Using `https://127.0.0.1:8787`
✅ Use `https://192.168.1.159:8787`

❌ Not accepting self-signed cert
✅ Click "Advanced" → "Proceed anyway"

❌ Forgetting to start companion
✅ Check with: `ps aux | grep companion`

❌ Using wrong profile IDs
✅ BAS: Use cloud profiles (e.g., 42014)
✅ AdsPower: Any profile works

---

## 📞 Support

**Logs location:** `/tmp/companion.log`

**Check status:**
```bash
curl -k https://192.168.1.159:8787/health
```

**Restart companion:**
```bash
pkill -f companion/server.cjs
export REMOTE_BROWSER_API_URL="http://65.21.199.228:3000"
export REMOTE_BROWSER_API_KEY="JTYDA_7531D_98HGTR_YT154"
HTTPS=true node companion/server.cjs > /tmp/companion.log 2>&1 &
```

---

## ✅ You're Ready!

Everything is set up and working. Just remember:

1. Start companion
2. Use network IP (192.168.1.159:8787)
3. Accept cert warning
4. Run your tests

🚀 **Happy Testing!**
