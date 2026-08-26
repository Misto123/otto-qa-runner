# No-Brainer Setup Guide

## Step-by-Step: From Zero to Running Tests in 2 Minutes

### Step 1: Start the Companion (on your Mac)

```bash
cd /Users/northsea/ClaudeProjects/otto-qa-runner
./start-companion.sh
```

**You'll see:**
```
📱 Remote device access URLs:
   https://192.168.1.159:8787
   https://192.168.1.197:8787
```

**Copy one of these URLs** ✂️

---

### Step 2: Open the Web App (on any device)

Visit: **https://otto-qa-runner.vercel.app**  
Password: **rereeu**

---

### Step 3: Test Connection (one-time setup)

1. **Paste the URL** you copied into the "Companion Server URL" field

2. **Click:** `🔌 Test Connection`

3. **If you see orange warning:**
   ```
   ⚠️ Certificate not accepted yet. Click the button below to accept it
   ```
   - Click the blue link that appears below
   - A new tab opens with a security warning
   - Click **"Advanced"** → **"Proceed to [IP address]"**
   - Close that tab
   - Return to the app

4. **Click:** `🔌 Test Connection` **again**

5. **You should now see:**
   ```
   ✅ Connected! Companion is ready (HTTPS)
   Ready to run tests
   ```

---

### Step 4: Configure Your Test

Fill in:
- ✅ Site URL (e.g., `https://www.otto.de`)
- ✅ Search keywords (e.g., `schuhe`)
- ✅ Select profiles (check the boxes)

---

### Step 5: Run!

Click the big green button: **▶ Run via AdsPower**

Watch the logs appear in real-time! 🎉

---

## Visual Flow

```
┌─────────────────────────────────────────────────────────┐
│  Step 1: Start Companion on Mac                        │
│  ./start-companion.sh                                   │
│  Copy: https://192.168.1.159:8787                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Step 2: Open Web App on Phone/Tablet                  │
│  https://otto-qa-runner.vercel.app                     │
│  Password: rereeu                                       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Step 3: Test Connection                                │
│  [Paste URL] → [🔌 Test Connection]                    │
│                                                          │
│  First time? Follow the link to accept certificate      │
│  Then test again until you see green ✅                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Step 4: Configure Test                                 │
│  - Site: otto.de                                        │
│  - Keywords: sneakers                                   │
│  - Profiles: ✓ k1fgmwtq ✓ k1f39ocj                    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Step 5: Run Test                                       │
│  [▶ Run via AdsPower] → Watch logs stream live! 🎊     │
└─────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### ❌ "Certificate not accepted yet"
**Solution:** Click the blue link, accept the warning, test again.

### ❌ "Cannot connect: Failed to fetch"
**Solutions:**
1. Make sure companion is still running on your Mac
2. Check both devices are on the same WiFi
3. Try a different IP address from the list

### ❌ "Test Connection" button stays gray
**Solution:** Make sure you pasted a URL (starts with `https://`)

### ❌ "Run via AdsPower" button is disabled
**Solution:** Click "Test Connection" first and wait for green ✅

---

## Quick Reference

| What | Where |
|------|-------|
| Web App | https://otto-qa-runner.vercel.app |
| Password | `rereeu` |
| Start Companion | `./start-companion.sh` |
| Test Connection | Click `🔌 Test Connection` until green ✅ |
| Run Test | Click `▶ Run via AdsPower` |

---

## That's It!

Once you've accepted the certificate (one time per device), you can run unlimited tests just by clicking the green button. No command line needed! 🚀
