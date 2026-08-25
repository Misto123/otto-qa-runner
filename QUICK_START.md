# Quick Start

Run from anywhere:
```bash
/Users/northsea/ClaudeProjects/otto-qa-runner/start-companion.sh
```

Or add an alias to your `~/.zshrc`:
```bash
echo 'alias otto-companion="cd /Users/northsea/ClaudeProjects/otto-qa-runner && npm run companion"' >> ~/.zshrc
source ~/.zshrc
```

Then simply run:
```bash
otto-companion
```

## Direct Commands

```bash
# Navigate to project
cd /Users/northsea/ClaudeProjects/otto-qa-runner

# Start companion
npm run companion

# Start local HTTP server (for testing from http://localhost:3001)
npm run serve

# Start both at once
npm run dev
```

## What You'll See

```
╔═══════════════════════════════════════════════════════╗
║       Otto QA Companion - AdsPower Runner            ║
╚═══════════════════════════════════════════════════════╝

✅ Companion listening on http://0.0.0.0:8787

📱 Remote device access URLs:
   http://192.168.1.159:8787
   http://192.168.1.197:8787
   http://192.168.68.112:8787

💡 Tip: Enter one of these URLs in the Vercel app's
   "Companion Server URL" field to run tests remotely.
```

Copy one of the shown IP addresses and use it in the Vercel app!

## Web Interface

Visit: https://otto-qa-runner.vercel.app
Password: `rereeu`
