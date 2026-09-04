# Remote Access Solutions for Otto QA Companion

The local HTTPS certificate issue prevents remote users from accessing your companion. Here are **three solutions** ranked by ease and security.

---

## Solution 1: Deploy Companion to VPS (Recommended) ⭐

**Deploy the companion to a VPS with a real domain and SSL certificate.**

### Why This Works
- ✅ Real SSL certificate (Let's Encrypt)
- ✅ No browser security warnings
- ✅ Works from anywhere in the world
- ✅ Professional setup

### Quick Setup

**Prerequisites:**
- VPS (DigitalOcean, Hetzner, Linode, AWS, etc.)
- Domain name (e.g., `companion.yourdomain.com`)
- DNS A record pointing to VPS IP

**Deploy:**
```bash
# SSH into your VPS
ssh root@your-vps-ip

# Download and run deployment script
curl -O https://raw.githubusercontent.com/Misto123/otto-qa-runner/main/scripts/deploy-companion-to-vps.sh
chmod +x deploy-companion-to-vps.sh
sudo ./deploy-companion-to-vps.sh

# Follow prompts:
# - Enter your domain: companion.yourdomain.com
# - Enter your email: you@email.com
# - Enter Remote Browser API URL (optional)
# - Enter Remote Browser API Key (optional)
```

**That's it!** The script will:
1. Install Node.js, nginx, certbot
2. Clone the repository
3. Get a free SSL certificate from Let's Encrypt
4. Configure nginx reverse proxy
5. Create a systemd service
6. Start the companion

**Access:** `https://companion.yourdomain.com`

**Update Vercel app:**
1. Go to https://otto-qa-runner.vercel.app
2. Set Companion URL to: `https://companion.yourdomain.com`
3. Test connection
4. Run tests from anywhere! 🎉

---

## Solution 2: Use Cloudflare Tunnel (No Domain Required)

**Expose your local companion via Cloudflare Tunnel (formerly Argo Tunnel).**

### Why This Works
- ✅ No VPS needed
- ✅ No domain needed (Cloudflare provides one)
- ✅ Automatic SSL certificate
- ✅ Free tier available
- ✅ Easy setup

### Quick Setup

**1. Install Cloudflare Tunnel:**
```bash
# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Windows
# Download from: https://github.com/cloudflare/cloudflared/releases
```

**2. Authenticate:**
```bash
cloudflared tunnel login
```

**3. Create tunnel:**
```bash
cloudflared tunnel create otto-qa-companion
```

**4. Create config file:**
```bash
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: otto-qa-companion
credentials-file: /Users/northsea/.cloudflared/<YOUR_TUNNEL_ID>.json

ingress:
  - hostname: otto-qa-companion.your-domain.com
    service: https://127.0.0.1:8787
    originRequest:
      noTLSVerify: true
  - service: http_status:404
EOF
```

**5. Route DNS:**
```bash
cloudflared tunnel route dns otto-qa-companion otto-qa-companion.your-domain.com
```

**6. Run tunnel:**
```bash
cloudflared tunnel run otto-qa-companion
```

**Access:** `https://otto-qa-companion.your-domain.com`

---

## Solution 3: Tailscale VPN (Secure Team Access)

**Create a private VPN for your team to access the local companion securely.**

### Why This Works
- ✅ Secure peer-to-peer VPN
- ✅ No public exposure
- ✅ No SSL certificate issues
- ✅ Free for personal use
- ✅ Works with Remote Browser API

### Quick Setup

**1. Install Tailscale:**
```bash
# macOS
brew install tailscale

# Linux
curl -fsSL https://tailscale.com/install.sh | sh

# Windows
# Download from: https://tailscale.com/download
```

**2. Start Tailscale:**
```bash
tailscale up
```

**3. Get your Tailscale IP:**
```bash
tailscale ip -4
# Example output: 100.64.1.2
```

**4. Share with team:**
- Go to https://login.tailscale.com
- Invite team members
- They install Tailscale and join your network

**5. Team members access:**
- Install Tailscale
- Connect to your network
- Access: `https://100.64.1.2:8787` (your Tailscale IP)
- Accept certificate warning (only once, per team member)

---

## Solution 4: ngrok (Quick Testing Only)

**Expose local companion temporarily via ngrok.**

⚠️ **Not recommended for production** - ngrok URLs change on restart

### Quick Setup

**1. Install ngrok:**
```bash
# macOS
brew install ngrok

# Or download from: https://ngrok.com/download
```

**2. Sign up and get auth token:**
- Go to https://dashboard.ngrok.com/signup
- Copy your auth token

**3. Configure:**
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

**4. Start tunnel:**
```bash
ngrok http https://127.0.0.1:8787
```

**5. Use the URL:**
```
Forwarding: https://abc123.ngrok.io -> https://127.0.0.1:8787
```

**Access:** `https://abc123.ngrok.io`

⚠️ **Limitations:**
- URL changes every time you restart ngrok
- Free tier has limits
- Not suitable for production

---

## Comparison Table

| Solution | Cost | Setup Time | SSL | Public Access | Best For |
|----------|------|------------|-----|---------------|----------|
| **VPS Deployment** | $5-10/mo | 10 min | ✅ Auto | ✅ Yes | Production, team use |
| **Cloudflare Tunnel** | Free | 5 min | ✅ Auto | ✅ Yes | Small teams, free tier |
| **Tailscale VPN** | Free | 2 min | ⚠️ Self-signed | ❌ VPN only | Private team access |
| **ngrok** | Free/Paid | 1 min | ✅ Auto | ✅ Yes | Quick testing only |

---

## Recommended Setup: VPS Deployment

**For production use with Remote Browser API, deploy to VPS:**

```bash
# 1. Get a cheap VPS ($5/mo)
#    - Hetzner: https://www.hetzner.com/cloud
#    - DigitalOcean: https://www.digitalocean.com
#    - Linode: https://www.linode.com

# 2. Point a subdomain to it
#    companion.yourdomain.com -> VPS IP

# 3. Run deployment script
ssh root@your-vps-ip
curl -O https://raw.githubusercontent.com/Misto123/otto-qa-runner/main/scripts/deploy-companion-to-vps.sh
chmod +x deploy-companion-to-vps.sh
sudo ./deploy-companion-to-vps.sh

# 4. Update Vercel app
#    Companion URL: https://companion.yourdomain.com

# 5. Done! ✅
```

---

## Architecture Comparison

### Before (Local Only):
```
User (anywhere) 
  → Vercel Web App
  → ❌ Can't reach local companion (HTTPS certificate issue)
```

### After (VPS Deployment):
```
User (anywhere)
  → Vercel Web App
  → ✅ VPS Companion (Real SSL)
  → Remote Browser API
  → AdsPower VPS
  → Browser Instances
```

### After (Cloudflare Tunnel):
```
User (anywhere)
  → Vercel Web App
  → ✅ Cloudflare Tunnel (Auto SSL)
  → Local Companion
  → Remote Browser API
  → AdsPower VPS
  → Browser Instances
```

---

## Environment Variable Update

After deploying to VPS/Tunnel, update the Vercel web app:

**Option A: Hardcode in HTML (Quick)**
```javascript
// In index.html, line ~800
const companionUrl = 'https://companion.yourdomain.com';
```

**Option B: Environment Variable (Better)**
```bash
# In Vercel dashboard
vercel env add COMPANION_URL
# Value: https://companion.yourdomain.com

# Update index.html to use it
const companionUrl = process.env.COMPANION_URL || 'https://127.0.0.1:8787';
```

**Option C: User Input (Most Flexible)**
Keep the current setup where users enter the companion URL manually.

---

## Security Considerations

### VPS Deployment
- ✅ Real SSL certificate (trusted by all browsers)
- ✅ Firewall configured
- ✅ Automatic SSL renewal
- ⚠️ Publicly accessible (add authentication if needed)

### Cloudflare Tunnel
- ✅ Cloudflare DDoS protection
- ✅ No ports open on local machine
- ✅ Free SSL certificate
- ⚠️ Traffic goes through Cloudflare

### Tailscale VPN
- ✅ End-to-end encrypted
- ✅ Zero-trust network
- ✅ Not publicly accessible
- ⚠️ All team members need Tailscale installed

---

## Next Steps

**Choose your solution:**

1. **For production use → VPS Deployment** (recommended)
2. **For free/small team → Cloudflare Tunnel**
3. **For private team access → Tailscale VPN**
4. **For quick testing → ngrok**

**All solutions eliminate the HTTPS certificate warning and enable remote access!** 🚀
