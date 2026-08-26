# Visual Walkthrough - What You'll See

## When Certificate Needs Acceptance

After clicking "🔌 Test Connection", you'll see:

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Certificate not accepted yet                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  👉 Click here to accept certificate                    │  ← BIG ORANGE BUTTON
└─────────────────────────────────────────────────────────┘

A new tab will open. Accept the security warning, then 
come back and click Test Connection again.
```

**What to do:**
1. Click the big orange button "👉 Click here to accept certificate"
2. A new tab opens showing a security warning
3. Click "Advanced" → "Proceed to [IP address]"
4. Close that tab and return
5. Click "🔌 Test Connection" again

---

## After Certificate Accepted

You'll see:

```
┌─────────────────────────────────────────────────────────┐
│ ✅ Connected! Companion is ready (HTTPS)                │
└─────────────────────────────────────────────────────────┘

✓ Ready to run tests

[▶ Run via AdsPower]  ← NOW ENABLED (green button)
```

**What to do:**
- Configure your test (site, keywords, profiles)
- Click the green "▶ Run via AdsPower" button
- Watch logs stream in real-time!

---

## If Connection Fails

You'll see:

```
┌─────────────────────────────────────────────────────────┐
│ ❌ Cannot connect: Connection failed                    │
└─────────────────────────────────────────────────────────┘

Make sure companion is running on your Mac
```

**What to do:**
1. Check companion is running: `ps aux | grep companion`
2. Restart if needed: `./start-companion.sh`
3. Try Test Connection again

---

## Common Issues

### "I clicked the button but nothing happened"
- The button opens a new tab. Check if your browser blocked popups
- Try right-click → "Open in new tab" instead

### "I accepted the certificate but still get the warning"
- Make sure you clicked "Proceed" (not just viewed the warning)
- The URL in the new tab should show `{"ok":true,...}`
- If blank or error, try a different IP from the companion list

### "The green button is still disabled"
- You need to click Test Connection AND see the green ✅ checkmark
- If stuck, refresh the page and start over

---

## Full Process (Visual)

```
Step 1: Paste URL
┌────────────────────────────────────┐
│ Companion Server URL               │
│ [https://192.168.1.159:8787]      │
└────────────────────────────────────┘
         ↓
Step 2: Test Connection
┌────────────────────────────────────┐
│ [🔌 Test Connection]               │
└────────────────────────────────────┘
         ↓
Step 3: Accept Certificate (first time only)
┌────────────────────────────────────┐
│ ⚠️ Certificate not accepted yet    │
│                                     │
│ [👉 Click here to accept...]      │  ← Click this
└────────────────────────────────────┘
         ↓
Step 4: Accept in New Tab
┌────────────────────────────────────┐
│ ⚠️ Your connection is not private  │
│                                     │
│ [Advanced] ────→ [Proceed]        │  ← Click these
└────────────────────────────────────┘
         ↓
Step 5: Test Again
┌────────────────────────────────────┐
│ [🔌 Test Connection]               │  ← Click again
└────────────────────────────────────┘
         ↓
Step 6: Success!
┌────────────────────────────────────┐
│ ✅ Connected! Ready to run tests   │
│                                     │
│ [▶ Run via AdsPower]              │  ← NOW ENABLED!
└────────────────────────────────────┘
```

---

## That's It!

The big orange button makes it impossible to miss. Just click it, accept the security warning in the new tab, then test again. Done! 🎉
