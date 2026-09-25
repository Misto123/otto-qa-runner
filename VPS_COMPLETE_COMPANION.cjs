/**
 * Otto QA Companion - VPS Version
 * Complete companion with Remote Browser API integration
 * Supports both AdsPower and BAS providers
 */

const http = require('http');

const PORT = process.env.PORT || 8788;
const HOST = '0.0.0.0';
const REMOTE_BROWSER_API_URL = process.env.REMOTE_BROWSER_API_URL || 'http://localhost:3000';
const REMOTE_BROWSER_API_KEY = process.env.REMOTE_BROWSER_API_KEY || 'JTYDA_7531D_98HGTR_YT154';

// In-memory storage for sessions
const manualLoginSessions = new Map();

/**
 * Make request to Remote Browser API
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = `${REMOTE_BROWSER_API_URL}${endpoint}`;
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
          const parsed = JSON.parse(data || '{}');
          resolve({ status: res.statusCode, data: parsed });
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

/**
 * Send JSON response with CORS
 */
function sendJSON(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(body));
}

/**
 * Read request body
 */
async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1000000) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Handle manual login start
 */
async function handleLoginStart(body) {
  const { profile_id, provider = 'adspower' } = body;
  
  if (!profile_id) {
    throw new Error('profile_id is required');
  }
  
  console.log(`[Login Start] Profile: ${profile_id}, Provider: ${provider}`);
  
  // Start browser via Remote Browser API
  const result = await apiRequest('/browser/start', 'POST', {
    profileId: profile_id,
    provider: provider,
    timeout: 1800000
  });
  
  if (!result.data.success) {
    throw new Error(result.data.error || 'Failed to start browser');
  }
  
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const browserData = result.data.data;
  
  // Store session
  manualLoginSessions.set(sessionId, {
    session_id: sessionId,
    profile_id: profile_id,
    provider: provider,
    browser_id: browserData.browserId,
    status: 'waiting',
    created_at: Date.now()
  });
  
  console.log(`[Login Start] Session created: ${sessionId}`);
  
  return {
    ok: true,
    session_id: sessionId,
    profile_id: profile_id,
    provider: provider,
    status: 'waiting',
    message: 'Browser opened. Please log in manually and call /login/complete'
  };
}

/**
 * Handle manual login complete
 */
async function handleLoginComplete(body) {
  const { session_id } = body;
  
  if (!session_id) {
    throw new Error('session_id is required');
  }
  
  const session = manualLoginSessions.get(session_id);
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  console.log(`[Login Complete] Session: ${session_id}`);
  
  // Stop browser
  await apiRequest('/browser/stop', 'POST', {
    browserId: session.browser_id,
    provider: session.provider
  });
  
  // Update session
  session.status = 'completed';
  session.completed_at = Date.now();
  
  return {
    ok: true,
    session_id: session_id,
    message: 'Login confirmed and browser closed'
  };
}

/**
 * List profiles
 */
async function handleListProfiles(provider = 'adspower') {
  const result = await apiRequest(`/profiles/list?provider=${provider}&page=1&pageSize=200`, 'GET');
  
  if (!result.data.success) {
    throw new Error(result.data.error || 'Failed to list profiles');
  }
  
  return {
    ok: true,
    profiles: result.data.data.profiles || []
  };
}

/**
 * Main HTTP server
 */
const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }
  
  try {
    // Health check
    if (req.url === '/health' && req.method === 'GET') {
      return sendJSON(res, 200, {
        ok: true,
        service: 'otto-qa-companion',
        location: 'vps',
        port: PORT,
        remote_api: REMOTE_BROWSER_API_URL
      });
    }
    
    // Manual login: start
    if (req.url === '/login/start' && req.method === 'POST') {
      const body = await readBody(req);
      const result = await handleLoginStart(body);
      return sendJSON(res, 200, result);
    }
    
    // Manual login: complete
    if (req.url === '/login/complete' && req.method === 'POST') {
      const body = await readBody(req);
      const result = await handleLoginComplete(body);
      return sendJSON(res, 200, result);
    }
    
    // Manual login: status
    if (req.url === '/login/status' && req.method === 'GET') {
      const sessions = Array.from(manualLoginSessions.values());
      return sendJSON(res, 200, { ok: true, sessions });
    }
    
    // List profiles
    if (req.url.startsWith('/login/profiles')) {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const provider = url.searchParams.get('provider') || 'adspower';
      const result = await handleListProfiles(provider);
      return sendJSON(res, 200, result);
    }
    
    // Proxy all other requests to Remote Browser API
    if (req.url.startsWith('/browser/') || req.url.startsWith('/profiles/')) {
      const body = req.method === 'POST' ? await readBody(req) : null;
      const result = await apiRequest(req.url, req.method, body);
      return sendJSON(res, result.status, result.data);
    }
    
    // Not found
    sendJSON(res, 404, { ok: false, error: 'Not found' });
    
  } catch (error) {
    console.error('[Error]', error.message);
    sendJSON(res, 500, { ok: false, error: error.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║     Otto QA Companion - VPS Edition                   ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ Listening on ${HOST}:${PORT}`);
  console.log(`🔗 Remote Browser API: ${REMOTE_BROWSER_API_URL}`);
  console.log(`📍 Providers: AdsPower + BAS`);
  console.log('');
  console.log('Press Ctrl+C to stop');
});
