#!/usr/bin/env node
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { validateConfig, runConfig } = require('../runner/otto-runner.cjs');
const { manualLoginFlow, completeManualLogin } = require('../runner/manual-login.cjs');
const { 
  getProfileMetadata, 
  isProfileLoggedIn, 
  getLoginDate, 
  getDaysSinceLogin,
  tagProfileLoggedIn,
  clearProfileLogin,
  getLoggedInProfiles
} = require('../runner/profile-metadata.cjs');
const { createProfileAndRegister } = require('../runner/otto-registration.cjs');
const { saveAccounts, loadAccounts, updateAccount } = require('../runner/account-storage.cjs');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 8787);
const USE_HTTPS = process.env.HTTPS === 'true' || process.env.HTTPS === '1';
const ALLOWED_ORIGINS = new Set(['https://otto-qa-runner.vercel.app', 'http://localhost', 'http://127.0.0.1']);
// Allow any local network origin for remote device access
const ALLOW_LOCAL_NETWORK = true;
const REPORTS_DIR = path.join(process.cwd(), 'reports');
const runs = new Map();
const manualLogins = new Map(); // Track active manual login sessions

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function send(res, status, body, origin) {
  const headers = {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'};
  // Allow requests from Vercel app or local network devices
  if (ALLOWED_ORIGINS.has(origin) || (ALLOW_LOCAL_NETWORK && origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}
function readBody(req) { return new Promise((resolve, reject) => { let data=''; req.on('data', chunk => { data += chunk; if (data.length > 1000000) req.destroy(); }); req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(new Error('Invalid JSON body')); } }); req.on('error', reject); }); }
function safeConfig(input) { const config = JSON.parse(JSON.stringify(input)); delete config.password; delete config.api_key; delete config.token; delete config.credentials; return config; }

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

function persistRun(id, state) {
  const filepath = path.join(REPORTS_DIR, `${id}.json`);
  try {
    fs.writeFileSync(filepath, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error(`Failed to persist run ${id}:`, err.message);
  }
}

function startRun(config) {
  const id = crypto.randomUUID();
  const state = {run_id:id, status:'running', started_at:new Date().toISOString(), progress:[], report:null, log:[], error:null};
  runs.set(id, state);
  persistRun(id, state);
  
  runConfig(config, {
    outputDir: path.join(process.cwd(), 'screenshots'), 
    onProgress: event => {
      state.progress.push({at:new Date().toISOString(), ...event});
      state.log.push(`[${new Date().toISOString()}] Profile ${event.profile_id}: ${event.status}`);
      persistRun(id, state);
    }
  })
    .then(report => { 
      state.status='completed'; 
      state.report=report; 
      state.completed_at=new Date().toISOString();
      state.log.push(`[${new Date().toISOString()}] Run completed`);
      persistRun(id, state);
    })
    .catch(error => { 
      state.status='failed'; 
      state.error=String(error.message || error); 
      state.completed_at=new Date().toISOString();
      state.log.push(`[${new Date().toISOString()}] Run failed: ${state.error}`);
      persistRun(id, state);
    });
  return id;
}

// Create server (HTTP or HTTPS)
let server;
if (USE_HTTPS) {
  const certPath = path.join(__dirname, '../certs/cert.pem');
  const keyPath = path.join(__dirname, '../certs/key.pem');
  
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.error('❌ HTTPS certificates not found. Run: npm run generate-certs');
    process.exit(1);
  }
  
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
  server = https.createServer(options, async (req, res) => {
    // Reuse the same handler
    await requestHandler(req, res);
  });
} else {
  server = http.createServer(requestHandler);
}

async function requestHandler(req, res) {
  const origin = req.headers.origin || '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) || (ALLOW_LOCAL_NETWORK && origin) ? origin : 'null';
  if (req.method === 'OPTIONS') { res.writeHead(204, {'Access-Control-Allow-Origin': allowOrigin, 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type', 'Vary':'Origin'}); return res.end(); }
  if (req.url === '/health' && req.method === 'GET') return send(res, 200, {ok:true, service:'otto-qa-companion', host:HOST, port:PORT, https: USE_HTTPS}, origin);
  if (req.url === '/run' && req.method === 'POST') { try { const config=safeConfig(await readBody(req)); const errors=validateConfig(config); if(errors.length) return send(res,422,{ok:false,error:errors.join('; ')},origin); return send(res,202,{ok:true,run_id:startRun(config)},origin); } catch(e) { return send(res,400,{ok:false,error:e.message},origin); } }
  
  const matchRun = req.url.match(/^\/runs\/([a-f0-9-]+)$/);
  if (matchRun && req.method === 'GET') { 
    const id = matchRun[1];
    let state = runs.get(id);
    if (!state) {
      const filepath = path.join(REPORTS_DIR, `${id}.json`);
      if (fs.existsSync(filepath)) {
        try {
          state = JSON.parse(fs.readFileSync(filepath, 'utf8'));
          runs.set(id, state);
        } catch (err) {
          return send(res, 500, {ok:false, error:'Failed to load run state'}, origin);
        }
      }
    }
    return state ? send(res,200,state,origin) : send(res,404,{ok:false,error:'Run not found'},origin); 
  }
  
  const matchLog = req.url.match(/^\/runs\/([a-f0-9-]+)\/log$/);
  if (matchLog && req.method === 'GET') {
    const id = matchLog[1];
    let state = runs.get(id);
    if (!state) {
      const filepath = path.join(REPORTS_DIR, `${id}.json`);
      if (fs.existsSync(filepath)) {
        try {
          state = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        } catch (err) {
          return send(res, 500, {ok:false, error:'Failed to load run log'}, origin);
        }
      }
    }
    return state ? send(res,200,{run_id:id, log:state.log || []},origin) : send(res,404,{ok:false,error:'Run not found'},origin);
  }
  
  // Manual login endpoints
  if (req.url === '/login/start' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { profile_id, provider = 'adspower' } = body;
      
      if (!profile_id) {
        return send(res, 400, { ok: false, error: 'profile_id required' }, origin);
      }
      
      const sessionId = crypto.randomUUID();
      const result = await manualLoginFlow(profile_id, provider, {
        onWaiting: (data) => {
          console.log(`[Manual Login] Session ${sessionId} started`);
        }
      });
      
      manualLogins.set(sessionId, {
        sessionId,
        profileId: profile_id,
        provider,
        browserId: result.browserId,
        startedAt: result.startedAt,
        status: 'waiting'
      });
      
      return send(res, 200, {
        ok: true,
        session_id: sessionId,
        profile_id,
        provider,
        status: 'waiting',
        message: 'Browser opened. Please log in manually and call /login/complete'
      }, origin);
      
    } catch (error) {
      console.error('[API] Error starting manual login:', error);
      return send(res, 500, { ok: false, error: error.message }, origin);
    }
  }
  
  if (req.url === '/login/complete' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { session_id, keep_open = false } = body;
      
      if (!session_id) {
        return send(res, 400, { ok: false, error: 'session_id required' }, origin);
      }
      
      const session = manualLogins.get(session_id);
      if (!session) {
        return send(res, 404, { ok: false, error: 'Session not found' }, origin);
      }
      
      const result = await completeManualLogin(
        session.profileId,
        session.provider,
        session.browserId,
        keep_open
      );
      
      if (result.success) {
        // Tag profile as logged in
        tagProfileLoggedIn(session.profileId, session.provider, 'otto.de');
        
        // Update session
        session.status = 'completed';
        session.completedAt = new Date().toISOString();
        
        return send(res, 200, {
          ok: true,
          ...result,
          message: 'Login verified and profile tagged'
        }, origin);
      } else {
        return send(res, 400, {
          ok: false,
          ...result,
          message: 'Login verification failed'
        }, origin);
      }
      
    } catch (error) {
      console.error('[API] Error completing manual login:', error);
      return send(res, 500, { ok: false, error: error.message }, origin);
    }
  }
  
  if (req.url === '/login/status' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const profileId = url.searchParams.get('profile_id');
    const provider = url.searchParams.get('provider') || 'adspower';
    
    if (!profileId) {
      return send(res, 400, { ok: false, error: 'profile_id required' }, origin);
    }
    
    const loggedIn = isProfileLoggedIn(profileId, provider, 'otto.de');
    const loginDate = getLoginDate(profileId, provider, 'otto.de');
    const daysSince = getDaysSinceLogin(profileId, provider, 'otto.de');
    
    return send(res, 200, {
      ok: true,
      profile_id: profileId,
      provider,
      logged_in: loggedIn,
      login_date: loginDate,
      days_since_login: daysSince
    }, origin);
  }
  
  if (req.url === '/login/profiles' && req.method === 'GET') {
    const profiles = getLoggedInProfiles('otto.de');
    return send(res, 200, { ok: true, profiles }, origin);
  }
  
  if (req.url === '/login/clear' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { profile_id, provider = 'adspower' } = body;
      
      if (!profile_id) {
        return send(res, 400, { ok: false, error: 'profile_id required' }, origin);
      }
      
      clearProfileLogin(profile_id, provider, 'otto.de');
      
      return send(res, 200, {
        ok: true,
        message: 'Login status cleared'
      }, origin);
      
    } catch (error) {
      return send(res, 500, { ok: false, error: error.message }, origin);
    }
  }
  
  // Registration endpoint
  if (req.url === '/register/otto' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { email, firstName, lastName, password, address, zipCode, city, phone, country, provider = 'adspower' } = body;
      
      if (!email || !firstName || !lastName || !password) {
        return send(res, 400, { ok: false, error: 'Missing required fields: email, firstName, lastName, password' }, origin);
      }
      
      console.log(`[API] Starting Otto registration for ${email}`);
      
      const accountData = {
        email,
        firstName,
        lastName,
        password,
        address: address || '',
        zipCode: zipCode || '',
        city: city || '',
        phone: phone || '',
        country: country || 'DE'
      };
      
      // Create profile and register
      const result = await createProfileAndRegister(accountData, provider);
      
      if (result.success) {
        return send(res, 200, {
          ok: true,
          success: true,
          profileId: result.profileId,
          email: result.email,
          message: 'Registration completed'
        }, origin);
      } else {
        return send(res, 400, {
          ok: false,
          success: false,
          error: result.error || 'Registration failed',
          email: result.email
        }, origin);
      }
      
    } catch (error) {
      console.error('[API] Registration error:', error);
      return send(res, 500, { ok: false, error: error.message }, origin);
    }
  }
  
  // Save accounts endpoint
  if (req.url === '/api/save-accounts' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { accounts } = body;
      
      if (!accounts || !Array.isArray(accounts)) {
        return send(res, 400, { ok: false, error: 'accounts array required' }, origin);
      }
      
      console.log(`[API] Saving ${accounts.length} accounts`);
      
      const saved = saveAccounts(accounts);
      
      return send(res, 200, {
        ok: true,
        saved: saved.length,
        message: `${saved.length} accounts saved`
      }, origin);
      
    } catch (error) {
      console.error('[API] Save accounts error:', error);
      return send(res, 500, { ok: false, error: error.message }, origin);
    }
  }
  
  // Load accounts endpoint
  if (req.url === '/api/load-accounts' && req.method === 'GET') {
    try {
      const accounts = loadAccounts();
      
      return send(res, 200, {
        ok: true,
        accounts,
        count: accounts.length
      }, origin);
      
    } catch (error) {
      console.error('[API] Load accounts error:', error);
      return send(res, 500, { ok: false, error: error.message }, origin);
    }
  }
  
  // Update account endpoint
  if (req.url === '/api/update-account' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { accountId, updates } = body;
      
      if (!accountId || !updates) {
        return send(res, 400, { ok: false, error: 'accountId and updates required' }, origin);
      }
      
      const updated = updateAccount(accountId, updates);
      
      return send(res, 200, {
        ok: true,
        account: updated
      }, origin);
      
    } catch (error) {
      console.error('[API] Update account error:', error);
      return send(res, 500, { ok: false, error: error.message }, origin);
    }
  }
  
  return send(res,404,{ok:false,error:'Not found'},origin);
}

server.listen(PORT, HOST, () => {
  const ips = getLocalIPs();
  const protocol = USE_HTTPS ? 'https' : 'http';
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║       Otto QA Companion - AdsPower Runner            ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  console.log(`✅ Companion listening on ${protocol}://${HOST}:${PORT}`);
  if (USE_HTTPS) {
    console.log(`🔒 HTTPS enabled (self-signed certificate)`);
    console.log(`⚠️  You'll need to accept the security warning in your browser\n`);
  }
  if (ips.length > 0) {
    console.log(`\n📱 Remote device access URLs:`);
    ips.forEach(ip => console.log(`   ${protocol}://${ip}:${PORT}`));
    console.log(`\n💡 Tip: Enter one of these URLs in the Vercel app's`);
    console.log(`   "Companion Server URL" field to run tests remotely.\n`);
  }
  console.log(`Press Ctrl+C to stop\n`);
});

process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
module.exports = { server, validateConfig };
