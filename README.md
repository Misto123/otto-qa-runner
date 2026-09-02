# Otto.de Product Visits - QA Runner

> Automated browser testing tool for Otto.de product visits using AdsPower profiles

## 🌐 Architecture

This tool has **two components**:

### 1. Web Interface (Vercel - Public)
- **URL:** https://otto-qa-runner.vercel.app
- **Password:** `rereeu`
- Accessible by anyone in your team worldwide
- Configure tests, view results, monitor live progress

### 2. Companion Server (Local - Must Run Where AdsPower Is)
- **Must run on a machine with AdsPower installed**
- Receives test configurations from web interface
- Controls AdsPower profiles via local API
- Runs browser automation scripts

## 🚀 Quick Start

### For Team Members (Running Tests)

1. **Start Companion Server** (on machine with AdsPower)
   ```bash
   cd otto-qa-runner
   HTTPS=true node companion/server.cjs
   ```
   
   You'll see:
   ```
   ✅ Companion listening on https://0.0.0.0:8787
   📱 Remote device access URLs:
      https://192.168.x.x:8787
   ```

2. **Open Web Interface**
   - Go to: https://otto-qa-runner.vercel.app
   - Enter password: `rereeu`

3. **Configure Connection**
   - **Local testing:** Use `https://127.0.0.1:8787`
   - **Remote testing:** Use `https://YOUR_IP:8787` (from step 1)
   - Click "Test Connection"
   - Accept certificate warning if prompted

4. **Run Tests**
   - Select profiles (200 available)
   - Enter product URL or search keywords
   - Configure scroll, cart actions, etc.
   - Click "Run via AdsPower"

## 📋 Use Cases

### Case 1: Local Testing (Developer's Machine)
```
Developer's Machine:
  ├─ AdsPower (running)
  ├─ Companion Server (localhost:8787)
  └─ Browser → https://otto-qa-runner.vercel.app → connects to localhost
```

### Case 2: Remote Testing (Team Member → QA Server)
```
Team Member's Laptop (anywhere in world):
  └─ Browser → https://otto-qa-runner.vercel.app

      ↓ (connects over internet)

QA Server (with public IP):
  ├─ AdsPower (running)
  ├─ Companion Server (public IP:8787)
  └─ 200 profiles ready
```

### Case 3: Multiple Team Members → Same Server
```
Team Member A (USA) ─┐
Team Member B (EU)  ─┼→ https://otto-qa-runner.vercel.app
Team Member C (Asia) ─┘
                       ↓
                   QA Server (Germany)
                   https://qa-server.company.com:8787
```

## 🔒 Security Notes

### HTTPS Certificate
The companion uses a **self-signed certificate** for HTTPS:
- **First time:** Browser will show security warning → Click "Accept" or "Proceed"
- **Why HTTPS?** Vercel (HTTPS) → Companion must also use HTTPS (mixed content policy)
- **Production:** Use proper SSL certificate (Let's Encrypt, etc.)

### Firewall / Network
For **remote access**, ensure:
- Port `8787` is open on the companion machine
- Firewall allows incoming connections
- Use VPN or restrict IP access for security

## 📦 Companion Server Setup

### Local Development
```bash
# Clone repo
git clone https://github.com/Misto123/otto-qa-runner.git
cd otto-qa-runner

# Install dependencies
npm install

# Start companion
HTTPS=true node companion/server.cjs
```

### Production Server
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone https://github.com/Misto123/otto-qa-runner.git
cd otto-qa-runner
npm install

# Run with PM2 (auto-restart)
npm install -g pm2
pm2 start companion/server.cjs --name otto-companion --env HTTPS=true
pm2 save
pm2 startup
```

### Docker Deployment (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
ENV HTTPS=true
EXPOSE 8787
CMD ["node", "companion/server.cjs"]
```

```bash
docker build -t otto-qa-companion .
docker run -d -p 8787:8787 -e HTTPS=true otto-qa-companion
```

## 🔧 Configuration

### Companion Server Environment Variables
```bash
HTTPS=true          # Enable HTTPS (required for Vercel app)
PORT=8787          # Port (default: 8787)
HOST=0.0.0.0       # Listen on all interfaces (for remote access)
```

### Web Interface
All configuration is done through the UI:
- Companion URL (can be localhost or remote server)
- Profile selection (200 profiles)
- Product URL or search keywords
- Scroll behavior, cart actions
- Screenshots, duration estimates

## 📊 Features

✅ **200 AdsPower Profiles** - Loaded from API  
✅ **Search or Direct URL** - Flexible product selection  
✅ **Human-like Behavior** - Random waits, varied scrolling  
✅ **Cookie Acceptance** - Automatic dialog handling  
✅ **Cart Actions** - Add/remove from cart (QA only)  
✅ **Screenshots** - Capture at each step  
✅ **Live Logs** - Real-time progress updates  
✅ **Duration Estimates** - ~45s per product visit  
✅ **Parallel Tests** - Multiple profiles simultaneously  
✅ **Auto Cleanup** - Tabs closed, profiles stopped  

## 🐛 Troubleshooting

### "Cannot connect to companion"
1. Is companion server running? Check terminal
2. Is URL correct in web interface?
3. Firewall blocking port 8787?
4. For HTTPS: Accept certificate first (open URL in browser)

### "No product items found"
1. Check if search keywords return results on otto.de
2. Try with direct product URL instead
3. Check logs for detailed error

### "Profile start failed"
1. Is AdsPower running on the same machine as companion?
2. Is profile ID correct? Check AdsPower UI
3. Check AdsPower local API: `http://local.adspower.com:50325/api/v1/user/list`

### Certificate Warnings
**Expected behavior** with self-signed certificates:
1. First connection: Browser warns about certificate
2. Click "Advanced" → "Proceed to..." or "Accept Risk"
3. Certificate is saved, future connections work

**For production:** Use proper SSL certificate from Let's Encrypt

## 📂 Project Structure

```
otto-qa-runner/
├── index.html              # Web UI (deployed to Vercel)
├── companion/
│   ├── server.cjs          # Companion API server
│   └── cert/               # Self-signed certificates
├── runner/
│   └── otto-runner.cjs     # Browser automation logic
├── screenshots/            # Captured screenshots
└── README.md              # This file
```

## 🎯 Workflow Summary

```
1. Team member opens: https://otto-qa-runner.vercel.app
2. Enters companion URL: https://qa-server.company.com:8787
3. Tests connection
4. Configures test (profiles, product, actions)
5. Clicks "Run via AdsPower"
6. Web app sends config to companion server
7. Companion controls AdsPower → Opens browsers → Runs test
8. Live logs stream back to web interface
9. Results displayed in web UI
10. Screenshots saved on companion server
```

## 🚀 Production Checklist

- [ ] Companion server running on machine with AdsPower
- [ ] Port 8787 accessible (firewall configured)
- [ ] HTTPS enabled (`HTTPS=true`)
- [ ] SSL certificate accepted on all client browsers
- [ ] AdsPower profiles loaded (200+)
- [ ] Web interface accessible: https://otto-qa-runner.vercel.app
- [ ] Password distributed to team: `rereeu`
- [ ] Team knows companion URL (IP or domain)
- [ ] Screenshots directory writable
- [ ] Logs monitored (companion server output)

## 📞 Support

For issues or questions, check:
- Companion server logs (terminal output)
- Browser console (F12 → Console)
- Screenshots directory for captured images
- GitHub issues: https://github.com/Misto123/otto-qa-runner

---

**Made with ❤️ for automated QA testing**
