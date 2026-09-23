# Quick VPS Deployment - Copy & Paste Commands

## 🚀 Run These Commands on Your VPS (65.21.199.228)

### Step 1: Create Directory and Server File

```bash
# Create directory
sudo mkdir -p /opt/otto-qa-companion
sudo chown $USER:$USER /opt/otto-qa-companion
cd /opt/otto-qa-companion

# Create server file
cat > server.cjs << 'EOF_SERVER'
const http = require('http');
const PORT = process.env.PORT || 8788;
const REMOTE_API = process.env.REMOTE_BROWSER_API_URL || 'http://localhost:3000';
const API_KEY = process.env.REMOTE_BROWSER_API_KEY || 'JTYDA_7531D_98HGTR_YT154';

async function proxy(path, method, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      method: method,
      headers: {'Content-Type':'application/json','x-api-key':API_KEY}
    };
    const req = http.request(REMOTE_API + path, opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({status:res.statusCode, data:JSON.parse(data||'{}')}));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

http.createServer(async (req, res) => {
  const headers = {
    'Content-Type':'application/json',
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type'
  };
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    return res.end();
  }
  
  if (req.url === '/health') {
    res.writeHead(200, headers);
    return res.end(JSON.stringify({ok:true, service:'otto-qa-companion', location:'vps'}));
  }
  
  try {
    let body = '';
    if (req.method === 'POST') {
      for await (const chunk of req) body += chunk;
      body = JSON.parse(body || '{}');
    }
    
    const result = await proxy(req.url, req.method, body);
    res.writeHead(result.status, headers);
    res.end(JSON.stringify(result.data));
  } catch (err) {
    res.writeHead(500, headers);
    res.end(JSON.stringify({ok:false, error:err.message}));
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Companion running on port ${PORT}`);
});
EOF_SERVER
```

### Step 2: Create Systemd Service

```bash
sudo tee /etc/systemd/system/otto-companion.service > /dev/null << 'EOF_SERVICE'
[Unit]
Description=Otto QA Companion
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/otto-qa-companion
Environment="PORT=8788"
Environment="REMOTE_BROWSER_API_URL=http://localhost:3000"
Environment="REMOTE_BROWSER_API_KEY=JTYDA_7531D_98HGTR_YT154"
ExecStart=/usr/bin/node /opt/otto-qa-companion/server.cjs
Restart=always

[Install]
WantedBy=multi-user.target
EOF_SERVICE
```

### Step 3: Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable otto-companion
sudo systemctl start otto-companion
```

### Step 4: Test It

```bash
# Check status
sudo systemctl status otto-companion

# Test endpoint
curl http://localhost:8788/health

# Check logs
sudo journalctl -u otto-companion -f
```

---

## ✅ Done! Now Update Web UI

**Companion URL:** `http://65.21.199.228:8788`

1. Go to: https://otto-qa-runner.vercel.app/
2. Enter: `65.21.199.228` in Mac IP field
3. URL will show: `https://65.21.199.228:8788` (change to HTTP)
4. Or just paste: `http://65.21.199.228:8788`
5. Click Test Connection

**Works from anywhere! No local network issues!** 🎉

---

## 🔧 Useful Commands

```bash
# View logs
sudo journalctl -u otto-companion -f

# Restart
sudo systemctl restart otto-companion

# Stop
sudo systemctl stop otto-companion

# Check status
sudo systemctl status otto-companion
```

---

## 🌐 Optional: Add HTTPS with Domain

If you have a domain pointing to this VPS:

```bash
# Install certbot
sudo apt-get install -y certbot

# Get certificate
sudo certbot certonly --standalone -d companion.yourdomain.com

# Then setup nginx reverse proxy with SSL
```

But HTTP works fine for testing!

