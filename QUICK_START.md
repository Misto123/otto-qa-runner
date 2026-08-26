# Quick Start

## For Remote Access (Recommended)

Run with HTTPS to work from Vercel app on any device:

```bash
/Users/northsea/ClaudeProjects/otto-qa-runner/start-companion.sh
```

Or manually:
```bash
cd /Users/northsea/ClaudeProjects/otto-qa-runner
npm run companion:https
```

**First time setup:** Accept the self-signed certificate warning in your browser when accessing the companion URL.

## For Local Testing Only

Run with HTTP (works only from localhost):
```bash
cd /Users/northsea/ClaudeProjects/otto-qa-runner
npm run companion
```

## Set up Alias (Optional)

Add to your `~/.zshrc`:
```bash
echo 'alias otto-companion="cd /Users/northsea/ClaudeProjects/otto-qa-runner && npm run companion:https"' >> ~/.zshrc
source ~/.zshrc
```

Then from anywhere:
```bash
otto-companion
```

## What You'll See

```
╔══════��════════════════════════════════════════════════╗
║       Otto QA Companion - AdsPower Runner            ║
╚═══════════════════════════════════════════════════════╝

✅ Companion listening on https://0.0.0.0:8787
🔒 HTTPS enabled (self-signed certificate)
⚠️  You'll need to accept the security warning in your browser

📱 Remote device access URLs:
   https://192.168.1.159:8787
   https://192.168.1.197:8787

💡 Tip: Enter one of these URLs in the Vercel app's
   "Companion Server URL" field to run tests remotely.
```

## Using with Vercel App

1. **Copy one of the HTTPS URLs** shown above (e.g., `https://192.168.1.159:8787`)
2. **Visit:** https://otto-qa-runner.vercel.app
3. **Password:** `rereeu`
4. **Paste the URL** into "Companion Server URL" field
5. **First time only:** Click the URL to open it in a new tab and accept the certificate warning
6. **Return to the app** and click **▶ Run via AdsPower**
7. **Watch live logs!** ✨

## Troubleshooting

### "Connection blocked by browser security"
- Make sure you're using HTTPS URLs (not http://)
- Open the companion URL in a new tab first to accept the certificate
- Try refreshing the Vercel app page

### "Certificate warning"
- This is normal for self-signed certificates
- Click "Advanced" → "Proceed" (or equivalent in your browser)
- You only need to do this once per device

### "Cannot connect"
- Verify companion is running: `ps aux | grep companion`
- Check firewall allows incoming connections on port 8787
- Ensure both devices are on the same WiFi network
