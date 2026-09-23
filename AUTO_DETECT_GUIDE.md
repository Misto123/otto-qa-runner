# Auto-Detect Companion IP - User Guide

## 🎯 Problem Solved

**Before:** Users had to manually find and enter the companion server IP address.

**After:** One-click auto-detection finds the companion server automatically!

---

## 🚀 How to Use (From Any PC)

### Step 1: Open the Web UI
```
https://otto-qa-runner.vercel.app/
```

### Step 2: Find "Companion Server" Section
Scroll down - you'll see a new panel with:
- Companion Server URL input field
- 🔍 **Auto-Detect IPs** button
- 🔌 **Test Connection** button

### Step 3: Auto-Detect
Click **🔍 Auto-Detect IPs**

What happens:
- Scans your network for companion servers
- Checks common IP ranges (192.168.x.x, 10.x.x.x, etc.)
- Takes 10-30 seconds
- Shows progress: "Scanned 50/1275 IPs... Found: 0"

### Step 4: Select Detected Server
When found, you'll see:
```
✅ Found 1 companion server(s):

[⭐ Use https://192.168.1.159:8787]

Click a button to select and test that URL
```

Click the **Use** button → URL auto-fills!

### Step 5: Test Connection
Click **🔌 Test Connection**

- First time: Accept security certificate warning
- Shows: ✅ Connected! Companion is ready (HTTPS)

### Step 6: Run Tests!
Everything is ready - start testing!

---

## 🔍 What Gets Scanned?

Auto-detect checks these IP ranges:
- `192.168.1.x` (most home WiFi)
- `192.168.0.x` (some routers)
- `10.0.0.x` (corporate networks)
- `172.16.0.x` (private networks)
- `100.123.218.x` (VPN/Tailscale)

Each IP: 2-second timeout  
Scans in batches of 20 (parallel)  
Stops once a companion is found

---

## ✅ Summary

1. Open https://otto-qa-runner.vercel.app/ from **any PC**
2. Click **🔍 Auto-Detect IPs**
3. Wait ~10-30 seconds
4. Click **Use** on found server
5. Click **🔌 Test Connection**
6. Accept certificate (first time only)
7. **Start testing!**

**No manual IP configuration needed!** 🚀

