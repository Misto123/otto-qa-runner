#!/bin/bash

# ============================================================================
# Otto QA Companion - VPS Deployment Script
# Run this on your VPS (65.21.199.228)
# ============================================================================

set -e

echo "🚀 Otto QA Companion - VPS Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Configuration
COMPANION_DIR="/opt/otto-qa-companion"
COMPANION_PORT="8788"
REMOTE_BROWSER_API_URL="http://localhost:3000"
REMOTE_BROWSER_API_KEY="JTYDA_7531D_98HGTR_YT154"

echo "📋 Configuration:"
echo "  Directory: $COMPANION_DIR"
echo "  Port: $COMPANION_PORT"
echo "  Remote Browser API: $REMOTE_BROWSER_API_URL"
echo ""

# Step 1: Check Node.js
echo "1️⃣ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js found: $(node --version)"
fi
echo ""

# Step 2: Create directory
echo "2️⃣ Creating companion directory..."
sudo mkdir -p $COMPANION_DIR
sudo chown $USER:$USER $COMPANION_DIR
echo "✅ Directory created: $COMPANION_DIR"
echo ""

# Step 3: Create companion server file
echo "3️⃣ Creating companion server..."
cat > $COMPANION_DIR/server.cjs << 'COMPANION_EOF'
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const os = require('os');

const PORT = process.env.PORT || 8788;
const HOST = process.env.HOST || '0.0.0.0';
const USE_HTTPS = process.env.HTTPS === 'true';
const REMOTE_BROWSER_API_URL = process.env.REMOTE_BROWSER_API_URL || 'http://localhost:3000';
const REMOTE_BROWSER_API_KEY = process.env.REMOTE_BROWSER_API_KEY || '';

let httpsOptions = {};
if (USE_HTTPS) {
  const selfsigned = require('selfsigned');
  const attrs = [{name:'commonName',value:'localhost'}];
  const pems = selfsigned.generate(attrs,{days:365});
  httpsOptions = {key:pems.private,cert:pems.cert};
}

const runs = new Map();
const manualLoginSessions = new Map();

function send(res, status, body, origin) {
  const allowOrigin = origin && origin.match(/^https?:\/\//) ? origin : '*';
  let headers = {'Content-Type':'application/json','Access-Control-Allow-Origin':allowOrigin,'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

function readBody(req) { 
  return new Promise((resolve, reject) => { 
    let data=''; 
    req.on('data', chunk => { 
      data += chunk; 
      if (data.length > 1000000) req.destroy(); 
    }); 
    req.on('end', () => { 
      try { 
        resolve(JSON.parse(data || '{}')); 
      } catch (e) { 
        reject(new Error('Invalid JSON body')); 
      } 
    }); 
    req.on('error', reject); 
  }); 
}

async function proxyToRemoteBrowser(path, method, body) {
  return new Promise((resolve, reject) => {
    const url = `${REMOTE_BROWSER_API_URL}${path}`;
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': REMOTE_BROWSER_API_KEY
      }
    };
    
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const server = (USE_HTTPS ? https : http).createServer(USE_HTTPS ? httpsOptions : {}, async (req, res) => {
  const origin = req.headers.origin;
  
  if (req.method === 'OPTIONS') { 
    res.writeHead(204, {
      'Access-Control-Allow-Origin': origin || '*', 
      'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 
      'Access-Control-Allow-Headers':'Content-Type', 
      'Vary':'Origin'
    }); 
    return res.end(); 
  }
  
  if (req.url === '/health' && req.method === 'GET') {
    return send(res, 200, {
      ok: true, 
      service: 'otto-qa-companion', 
      host: HOST, 
      port: PORT, 
      https: USE_HTTPS,
      location: 'vps'
    }, origin);
  }
  
  // Proxy to Remote Browser API
  if (req.url.startsWith('/browser/') || req.url.startsWith('/profiles/')) {
    try {
      const body = req.method === 'POST' ? await readBody(req) : null;
      const result = await proxyToRemoteBrowser(req.url, req.method, body);
      return send(res, result.status, result.data, origin);
    } catch (error) {
      return send(res, 500, { ok: false, error: error.message }, origin);
    }
  }
  
  // Manual login endpoints (proxy through)
  if (req.url.startsWith('/login/')) {
    try {
      const body = req.method === 'POST' ? await readBody(req) : null;
      const result = await proxyToRemoteBrowser(req.url, req.method, body);
      return send(res, result.status, result.data, origin);
    } catch (error) {
      return send(res, 500, { ok: false, error: error.message }, origin);
    }
  }
  
  // Registration endpoints (proxy through)
  if (req.url.startsWith('/register/') || req.url.startsWith('/api/')) {
    try {
      const body = req.method === 'POST' ? await readBody(req) : null;
      const result = await proxyToRemoteBrowser(req.url, req.method, body);
      return send(res, result.status, result.data, origin);
    } catch (error) {
      return send(res, 500, { ok: false, error: error.message }, origin);
    }
  }
  
  send(res, 404, { ok: false, error: 'Not found' }, origin);
});

server.listen(PORT, HOST, () => {
  console.log(`✅ Otto QA Companion (VPS) listening on ${USE_HTTPS?'https':'http'}://${HOST}:${PORT}`);
  console.log(`🔗 Remote Browser API: ${REMOTE_BROWSER_API_URL}`);
  console.log(`📍 Location: VPS`);
});
COMPANION_EOF

echo "✅ Companion server created"
echo ""

# Step 4: Create systemd service
echo "4️⃣ Creating systemd service..."
sudo tee /etc/systemd/system/otto-companion.service > /dev/null << SERVICE_EOF
[Unit]
Description=Otto QA Companion Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$COMPANION_DIR
Environment="PORT=$COMPANION_PORT"
Environment="HOST=0.0.0.0"
Environment="REMOTE_BROWSER_API_URL=$REMOTE_BROWSER_API_URL"
Environment="REMOTE_BROWSER_API_KEY=$REMOTE_BROWSER_API_KEY"
ExecStart=/usr/bin/node $COMPANION_DIR/server.cjs
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICE_EOF

echo "✅ Systemd service created"
echo ""

# Step 5: Start service
echo "5️⃣ Starting companion service..."
sudo systemctl daemon-reload
sudo systemctl enable otto-companion
sudo systemctl start otto-companion
sleep 2

echo "✅ Service started"
echo ""

# Step 6: Check status
echo "6️⃣ Checking service status..."
sudo systemctl status otto-companion --no-pager | head -20
echo ""

# Step 7: Test endpoint
echo "7️⃣ Testing companion endpoint..."
sleep 2
curl -s http://localhost:$COMPANION_PORT/health | jq '.' || curl -s http://localhost:$COMPANION_PORT/health
echo ""
echo ""

# Step 8: Setup nginx (optional)
echo "8️⃣ Setting up nginx reverse proxy (optional)..."
if command -v nginx &> /dev/null; then
    echo "Nginx found. Creating config..."
    
    sudo tee /etc/nginx/sites-available/otto-companion > /dev/null << NGINX_EOF
server {
    listen 80;
    server_name companion.yourdomain.com;  # Change this!
    
    location / {
        proxy_pass http://localhost:$COMPANION_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX_EOF
    
    echo "⚠️  Nginx config created at: /etc/nginx/sites-available/otto-companion"
    echo "⚠️  Edit the server_name and run:"
    echo "    sudo ln -s /etc/nginx/sites-available/otto-companion /etc/nginx/sites-enabled/"
    echo "    sudo nginx -t"
    echo "    sudo systemctl reload nginx"
else
    echo "ℹ️  Nginx not found. Skipping nginx setup."
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Companion Status:"
echo "  Service: otto-companion"
echo "  Port: $COMPANION_PORT"
echo "  URL: http://$(hostname -I | awk '{print $1}'):$COMPANION_PORT"
echo ""
echo "🔧 Useful Commands:"
echo "  Status:  sudo systemctl status otto-companion"
echo "  Logs:    sudo journalctl -u otto-companion -f"
echo "  Restart: sudo systemctl restart otto-companion"
echo "  Stop:    sudo systemctl stop otto-companion"
echo ""
echo "🌐 Access URLs:"
echo "  Direct: http://65.21.199.228:$COMPANION_PORT"
echo "  Test:   curl http://localhost:$COMPANION_PORT/health"
echo ""
echo "📝 Next Steps:"
echo "  1. Test: curl http://localhost:$COMPANION_PORT/health"
echo "  2. Update Vercel UI to use: http://65.21.199.228:$COMPANION_PORT"
echo "  3. Or setup nginx + domain for HTTPS"
echo ""

