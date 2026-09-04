# Otto QA Runner - Quick Start Guide

## 🚀 For Team Members

### Setup (One-Time)

**1. Clone Repository**
```bash
git clone https://github.com/Misto123/otto-qa-runner.git
cd otto-qa-runner
npm install
```

**2. Set API Credentials**
```bash
export REMOTE_BROWSER_API_URL="http://65.21.199.228:3000"
export REMOTE_BROWSER_API_KEY="JTYDA_7531D_98HGTR_YT154"
```

**3. Start Companion**
```bash
HTTPS=true node companion/server.cjs
```

You should see:
```
✅ Using Remote Browser API: http://65.21.199.228:3000
✅ Companion listening on https://0.0.0.0:8787
```

**4. Open Web Interface**

URL: https://otto-qa-runner.vercel.app  
Password: `rereeu`

**5. Run Tests**

Select profiles → Configure test → Click "Run via AdsPower" → Done!

---

## 🔧 For Server Admin

### Monitor Remote Browser API Health

**The Problem:** Nginx crashes → Port 8080 fails → All tests fail

**The Solution:** Continuous monitoring with alerts

### Setup Monitoring on Remote Browser API Server

```bash
# SSH into server
ssh root@65.21.199.228

# Download monitor script
cd /opt/remote-browser-api
curl -O https://raw.githubusercontent.com/Misto123/otto-qa-runner/main/scripts/monitor-remote-browser-api.sh
chmod +x monitor-remote-browser-api.sh

# Test it
./monitor-remote-browser-api.sh --api-key JTYDA_7531D_98HGTR_YT154

# Create systemd service for continuous monitoring
sudo tee /etc/systemd/system/remote-browser-monitor.service > /dev/null <<'EOF'
[Unit]
Description=Remote Browser API Health Monitor
After=network.target nginx.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/remote-browser-api
Environment="REMOTE_BROWSER_API_KEY=JTYDA_7531D_98HGTR_YT154"
Environment="REMOTE_BROWSER_API_URL=http://65.21.199.228:3000"
ExecStart=/opt/remote-browser-api/monitor-remote-browser-api.sh --api-key JTYDA_7531D_98HGTR_YT154 --continuous --interval 60
Restart=always
RestartSec=10
StandardOutput=append:/var/log/remote-browser-monitor.log
StandardError=append:/var/log/remote-browser-monitor.log

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable remote-browser-monitor
sudo systemctl start remote-browser-monitor

# Check status
sudo systemctl status remote-browser-monitor

# View logs
sudo journalctl -u remote-browser-monitor -f
```

### Add Webhook Alerts (Optional)

**For Slack:**
1. Create Slack webhook: https://api.slack.com/messaging/webhooks
2. Update service file:
   ```bash
   ExecStart=/opt/remote-browser-api/monitor-remote-browser-api.sh \
     --api-key JTYDA_7531D_98HGTR_YT154 \
     --continuous \
     --interval 60 \
     --webhook "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
   ```
3. Restart service:
   ```bash
   sudo systemctl restart remote-browser-monitor
   ```

### Monitor Checklist

The script checks:
- ✅ API endpoint (port 3000) - Main API
- ✅ WebSocket proxy (port 8080) - Browser connections
- ✅ Nginx service status
- ✅ Sends alerts when issues detected

### When Nginx Crashes

**Symptoms:**
- API endpoint still works (port 3000)
- WebSocket fails (port 8080)
- Tests fail with "403" or "ETIMEDOUT"

**Fix:**
```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

**Monitor will alert you automatically!**

---

## 📊 Architecture

```
Team Member (anywhere)
  ↓
Web Interface (https://otto-qa-runner.vercel.app)
  ↓
Companion Server (local or VPS with env vars)
  ↓
Remote Browser API (http://65.21.199.228:3000)
  ↓ port 3000: API requests
  ↓ port 8080: WebSocket connections (nginx proxy)
  ↓
AdsPower VPS
  ↓
Browser Instances
```

---

## 🆘 Troubleshooting

### Tests Fail with "403" or "ETIMEDOUT"

**Problem:** Nginx crashed or port 8080 not accessible

**Check:**
```bash
curl -s -o /dev/null -w "%{http_code}" http://65.21.199.228:8080
```

**Fix (on server):**
```bash
sudo systemctl restart nginx
```

### Companion Says "Using local AdsPower API"

**Problem:** Environment variables not set

**Fix:**
```bash
export REMOTE_BROWSER_API_URL="http://65.21.199.228:3000"
export REMOTE_BROWSER_API_KEY="JTYDA_7531D_98HGTR_YT154"

# Restart companion
pkill -f companion/server.cjs
HTTPS=true node companion/server.cjs
```

### No Profiles Showing in Web Interface

**Problem:** Companion not connected or Remote Browser API down

**Fix:**
1. Check companion is running
2. Check Remote Browser API health:
   ```bash
   ./scripts/monitor-remote-browser-api.sh --api-key JTYDA_7531D_98HGTR_YT154
   ```

---

## 📝 Key Files

- **`REMOTE_BROWSER_COMPLETE.md`** - Complete technical documentation
- **`scripts/monitor-remote-browser-api.sh`** - Health monitoring script
- **`companion/server.cjs`** - Companion server
- **`runner/remote-browser-client.cjs`** - Remote Browser API client
- **`runner/otto-runner.cjs`** - Main test runner

---

## 🎯 Quick Reference

| What | Where | Credentials |
|------|-------|-------------|
| Web Interface | https://otto-qa-runner.vercel.app | Password: `rereeu` |
| Remote Browser API | http://65.21.199.228:3000 | Key: `JTYDA_7531D_98HGTR_YT154` |
| WebSocket Proxy | ws://65.21.199.228:8080 | Auto via API key |
| Companion (local) | https://localhost:8787 | Self-signed cert |
| GitHub Repo | https://github.com/Misto123/otto-qa-runner | - |

---

## ✅ Status

**Last Verified:** 2026-09-04

- ✅ Remote Browser API working
- ✅ WebSocket proxy working (nginx fixed)
- ✅ End-to-end tests passing (~24 seconds)
- ✅ Monitoring script created
- ✅ Documentation complete

**Ready for production use!** 🚀

---

## 📞 Support

**For questions:** Check documentation in repo  
**For issues:** Run monitoring script to diagnose  
**For nginx crashes:** Restart nginx on server (monitoring will alert)

**Repository:** https://github.com/Misto123/otto-qa-runner
