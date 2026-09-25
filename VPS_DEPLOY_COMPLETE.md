# VPS Deployment - Complete Companion (AdsPower + BAS)

## 🚀 Run These Commands in VPS Web Console

### Step 1: Create Directory
```bash
sudo mkdir -p /opt/otto-qa-companion
sudo chown $USER:$USER /opt/otto-qa-companion
cd /opt/otto-qa-companion
```

### Step 2: Create Complete Server File
```bash
cat > server.cjs << 'COMPANION_EOF'
const http = require('http');

const PORT = process.env.PORT || 8788;
const HOST = '0.0.0.0';
const REMOTE_API = process.env.REMOTE_BROWSER_API_URL || 'http://localhost:3000';
const API_KEY = process.env.REMOTE_BROWSER_API_KEY || 'JTYDA_7531D_98HGTR_YT154';

const sessions = new Map();

async function apiRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      method: method,
      headers: {'Content-Type':'application/json','x-api-key':API_KEY}
    };
    const req = http.request(REMOTE_API + endpoint, opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({status:res.statusCode, data:JSON.parse(data||'{}')});
        } catch(e) {
          resolve({status:res.statusCode, data:data});
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function sendJSON(res, status, body) {
  res.writeHead(status, {
    'Content-Type':'application/json',
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type'
  });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1000000) req.destroy();
    });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch (e) { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

async function handleLoginStart(body) {
  const { profile_id, provider = 'adspower' } = body;
  if (!profile_id) throw new Error('profile_id required');
  
  console.log(`[Login] Start ${profile_id} (${provider})`);
  
  const result = await apiRequest('/browser/start', 'POST', {
    profileId: profile_id,
    provider: provider,
    timeout: 1800000
  });
  
  if (!result.data.success) {
    throw new Error(result.data.error || 'Failed to start');
  }
  
  const sessionId = `s_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
  const browserData = result.data.data;
  
  sessions.set(sessionId, {
    session_id: sessionId,
    profile_id: profile_id,
    provider: provider,
    browser_id: browserData.browserId,
    status: 'waiting',
    created_at: Date.now()
  });
  
  console.log(`[Login] Session: ${sessionId}`);
  
  return {
    ok: true,
    session_id: sessionId,
    profile_id: profile_id,
    provider: provider,
    status: 'waiting',
    message: 'Browser opened. Please log in manually'
  };
}

async function handleLoginComplete(body) {
  const { session_id } = body;
  if (!session_id) throw new Error('session_id required');
  
  const session = sessions.get(session_id);
  if (!session) throw new Error('Session not found');
  
  console.log(`[Login] Complete ${session_id}`);
  
  await apiRequest('/browser/stop', 'POST', {
    browserId: session.browser_id,
    provider: session.provider
  });
  
  session.status = 'completed';
  session.completed_at = Date.now();
  
  return {
    ok: true,
    session_id: session_id,
    message: 'Login confirmed'
  };
}

async function handleListProfiles(provider) {
  const result = await apiRequest(`/profiles/list?provider=${provider}&page=1&pageSize=200`, 'GET');
  if (!result.data.success) throw new Error(result.data.error || 'Failed to list');
  return { ok: true, profiles: result.data.data.profiles || [] };
}

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin':'*',
      'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type'
    });
    return res.end();
  }
  
  try {
    if (req.url === '/health' && req.method === 'GET') {
      return sendJSON(res, 200, {
        ok:true, 
        service:'otto-qa-companion', 
        location:'vps',
        providers:['adspower','bas']
      });
    }
    
    if (req.url === '/login/start' && req.method === 'POST') {
      const body = await readBody(req);
      const result = await handleLoginStart(body);
      return sendJSON(res, 200, result);
    }
    
    if (req.url === '/login/complete' && req.method === 'POST') {
      const body = await readBody(req);
      const result = await handleLoginComplete(body);
      return sendJSON(res, 200, result);
    }
    
    if (req.url === '/login/status' && req.method === 'GET') {
      return sendJSON(res, 200, {ok:true, sessions:Array.from(sessions.values())});
    }
    
    if (req.url.startsWith('/login/profiles')) {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const provider = url.searchParams.get('provider') || 'adspower';
      const result = await handleListProfiles(provider);
      return sendJSON(res, 200, result);
    }
    
    if (req.url.startsWith('/browser/') || req.url.startsWith('/profiles/')) {
      const body = req.method === 'POST' ? await readBody(req) : null;
      const result = await apiRequest(req.url, req.method, body);
      return sendJSON(res, result.status, result.data);
    }
    
    sendJSON(res, 404, {ok:false, error:'Not found'});
  } catch (error) {
    console.error('[Error]', error.message);
    sendJSON(res, 500, {ok:false, error:error.message});
  }
}).listen(PORT, HOST, () => {
  console.log(`✅ Otto QA Companion (VPS) on ${HOST}:${PORT}`);
  console.log(`🔗 Remote API: ${REMOTE_API}`);
  console.log(`📍 Providers: AdsPower + BAS`);
});
COMPANION_EOF
```

### Step 3: Create Systemd Service
```bash
sudo tee /etc/systemd/system/otto-companion.service > /dev/null << 'SERVICE_EOF'
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
SERVICE_EOF
```

### Step 4: Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable otto-companion
sudo systemctl start otto-companion
```

### Step 5: Test It
```bash
# Check status
sudo systemctl status otto-companion

# Test endpoint
curl http://localhost:8788/health

# Should return:
# {"ok":true,"service":"otto-qa-companion","location":"vps","providers":["adspower","bas"]}
```

---

## ✅ Done! Use in Web UI

**Companion URL:** `http://100.116.3.99:8788`

1. Go to: https://otto-qa-runner.vercel.app/
2. Enter: `http://100.116.3.99:8788`
3. Click "Test Connection"
4. Should show: ✅ Connected!

**Features:**
- ✅ AdsPower profiles
- ✅ BAS profiles  
- ✅ Manual login
- ✅ Registration
- ✅ Works via Tailscale

**No more local IP issues!** 🎉

