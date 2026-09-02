# Zero-Config Setup Guide

## 🎯 Goal: One-Time Setup, Then It Just Works™

After this setup, the companion server and AdsPower will:
- ✅ Start automatically when you log in
- ✅ Restart automatically if they crash
- ✅ Work seamlessly with the web interface (no manual steps)

---

## 📦 One-Time Installation

### Step 1: Install Auto-Start

```bash
cd /Users/northsea/ClaudeProjects/otto-qa-runner
bash scripts/install-autostart.sh
```

**What this does:**
1. Creates logs directory
2. Makes scripts executable
3. Installs macOS LaunchAgent
4. Starts services immediately

**Output:**
```
🔧 Installing Otto QA Runner Auto-Start...
✅ Created logs directory
✅ Made start script executable
✅ Installed LaunchAgent
✅ LaunchAgent loaded

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Installation Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Starting services now...
📱 Starting AdsPower...
✅ AdsPower started
🔌 Starting companion server...
✅ Companion: Running (PID: 12345)
   📍 URL: https://127.0.0.1:8787
```

### Step 2: Done!

That's it. Services are now running and will auto-start on every login.

---

## 🌐 Using the Web Interface

### URL
https://otto-qa-runner.vercel.app

### Password
`rereeu`

### How It Works Now

1. **Open web interface** → Auto-connects to companion (happens silently)
2. **Select profiles** → Choose from 200 profiles
3. **Configure test** → Product URL or search keywords
4. **Click "Run via AdsPower"** → Test starts immediately

**No connection testing, no certificate accepting, no manual steps!**

---

## 📊 What Happens Behind the Scenes

### On Login (Automatic)
```
1. macOS LaunchAgent runs start-all.sh
2. AdsPower launches
3. Companion server starts (port 8787)
4. Services ready
```

### When You Open Web Interface (Automatic)
```
1. Page loads
2. Auto-connects to https://127.0.0.1:8787
3. If connected: Run button enabled
4. If not connected: Shows setup instructions
```

### When You Click Run (Automatic)
```
1. If not connected: Auto-reconnect attempt
2. Send config to companion
3. Companion controls AdsPower
4. Live logs stream back
5. Results displayed
```

---

## 🔍 Checking Status

### Are services running?
```bash
# Check LaunchAgent
launchctl list | grep otto

# Check processes
ps aux | grep -E "AdsPower|companion"
```

### View logs
```bash
# Companion logs
tail -f ~/ClaudeProjects/otto-qa-runner/logs/companion.log

# LaunchAgent logs
tail -f ~/ClaudeProjects/otto-qa-runner/logs/launchd.out.log
```

### Test connection manually
```bash
curl -k https://127.0.0.1:8787/health
# Should return: {"ok":true,"service":"otto-qa-companion",...}
```

---

## 🛠️ Manual Control (if needed)

### Start manually (one-time)
```bash
bash /Users/northsea/ClaudeProjects/otto-qa-runner/scripts/start-all.sh
```

### Stop services
```bash
# Stop companion
pkill -f companion/server.cjs

# Stop AdsPower
killall AdsPower

# Stop LaunchAgent
launchctl unload ~/Library/LaunchAgents/com.otto.qa-runner.plist
```

### Restart services
```bash
# Restart companion only
pkill -f companion/server.cjs
bash /Users/northsea/ClaudeProjects/otto-qa-runner/scripts/start-all.sh

# Restart everything
launchctl unload ~/Library/LaunchAgents/com.otto.qa-runner.plist
launchctl load ~/Library/LaunchAgents/com.otto.qa-runner.plist
```

---

## 🗑️ Uninstall (if needed)

```bash
# Stop and remove LaunchAgent
launchctl unload ~/Library/LaunchAgents/com.otto.qa-runner.plist
rm ~/Library/LaunchAgents/com.otto.qa-runner.plist

# Stop services
pkill -f companion/server.cjs
killall AdsPower
```

---

## 🚨 Troubleshooting

### Web interface shows "Start companion server first"

**Cause:** Companion is not running

**Fix:**
```bash
bash /Users/northsea/ClaudeProjects/otto-qa-runner/scripts/start-all.sh
```

Then refresh the web page.

### "Certificate not accepted" error

**One-time fix:**
1. Open https://127.0.0.1:8787 in browser
2. Click "Advanced" → "Proceed to 127.0.0.1 (unsafe)"
3. Close tab, refresh web interface

This only happens once per browser.

### AdsPower profiles not found

**Cause:** AdsPower not running or API not accessible

**Fix:**
```bash
# Check if AdsPower is running
ps aux | grep AdsPower

# Start AdsPower
open -a /Applications/AdsPower.app

# Test API
curl http://local.adspower.com:50325/api/v1/user/list
```

### Services not starting on login

**Check LaunchAgent:**
```bash
launchctl list | grep otto

# If not listed, reinstall:
bash /Users/northsea/ClaudeProjects/otto-qa-runner/scripts/install-autostart.sh
```

---

## 📋 File Locations

| Component | Location |
|-----------|----------|
| **Project** | `/Users/northsea/ClaudeProjects/otto-qa-runner` |
| **LaunchAgent** | `~/Library/LaunchAgents/com.otto.qa-runner.plist` |
| **Start Script** | `scripts/start-all.sh` |
| **Logs** | `logs/companion.log` |
| **Web Interface** | https://otto-qa-runner.vercel.app |

---

## ✅ Summary

**Before:**
1. Start AdsPower manually
2. Start companion manually
3. Open web interface
4. Enter companion URL
5. Test connection
6. Accept certificate
7. Run tests

**After:**
1. Open web interface
2. Run tests

**That's it!** Everything else happens automatically. 🎉

---

## 🔗 Quick Links

- **Web Interface:** https://otto-qa-runner.vercel.app
- **Password:** `rereeu`
- **Local Companion:** https://127.0.0.1:8787
- **Logs:** `~/ClaudeProjects/otto-qa-runner/logs/`
