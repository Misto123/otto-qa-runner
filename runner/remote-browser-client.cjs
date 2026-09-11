/**
 * Remote Browser API Client
 * Connects to REBEL Internet Remote Browser API for AdsPower VPS
 */

const REMOTE_BROWSER_API_URL = process.env.REMOTE_BROWSER_API_URL || 'http://95.217.224.154:3000';
const REMOTE_BROWSER_API_KEY = process.env.REMOTE_BROWSER_API_KEY;
const { getNextBASProxy } = require('./bas-proxies.cjs');

if (!REMOTE_BROWSER_API_KEY) {
  console.warn('⚠️  REMOTE_BROWSER_API_KEY not set. Remote browser features will not work.');
}

/**
 * Make authenticated request to Remote Browser API
 */
async function makeRequest(endpoint, options = {}) {
  const url = `${REMOTE_BROWSER_API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x_api_key': REMOTE_BROWSER_API_KEY,
      ...options.headers
    }
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Unknown API error');
  }
  
  return result.data;
}

/**
 * Start browser on Remote Browser API (AdsPower VPS)
 */
async function startRemoteBrowser(profileId, provider = 'adspower', timeout = 1800000) {
  console.log(`  → Starting remote browser for profile: ${profileId} (provider: ${provider})`);
  
  const body = {
    provider: provider,
    timeout: timeout,
    clientId: 'otto-qa-runner'
  };
  
  // Add profileId or proxy based on provider
  if (provider === 'bas') {
    // BAS: use rotating proxy, profileId optional (numeric)
    body.proxy = getNextBASProxy();
    if (profileId !== null && profileId !== undefined) {
      // Ensure profileId is a number for BAS
      body.profileId = typeof profileId === 'string' ? parseInt(profileId, 10) : profileId;
    }
    console.log(`  → Using BAS proxy: ${body.proxy.substring(0, 40)}...`);
  } else {
    // AdsPower: profileId required (string)
    body.profileId = String(profileId);
  }
  
  const data = await makeRequest('/browsers/start', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  
  // Add API key to WebSocket URL as per Remote Browser API docs
  const authenticatedUrl = `${data.puppeteerUrl}${data.puppeteerUrl.includes('?') ? '&' : '?'}x_api_key=${REMOTE_BROWSER_API_KEY}`;
  
  console.log(`  → Remote browser started: ${data.browserId}`);
  console.log(`  → Puppeteer URL: ${authenticatedUrl.substring(0, 50)}...`);
  
  return {
    browserId: data.browserId,
    puppeteerUrl: authenticatedUrl,
    ws: { puppeteer: authenticatedUrl },
    timeout: data.timeout,
    remainingTime: data.remainingTime
  };
}

/**
 * Stop browser on Remote Browser API
 */
async function stopRemoteBrowser(browserId, provider = 'adspower') {
  console.log(`  → Stopping remote browser: ${browserId} (provider: ${provider})`);
  
  const data = await makeRequest('/browsers/stop', {
    method: 'POST',
    body: JSON.stringify({
      provider: provider,
      browserId: browserId
    })
  });
  
  console.log(`  → Remote browser stopped`);
  
  if (data.urls && data.urls.length > 0) {
    console.log(`  → Visited URLs: ${data.urls.length}`);
  }
  
  if (data.screenshots && data.screenshots.length > 0) {
    console.log(`  → Screenshots captured: ${data.screenshots.length}`);
    data.screenshots.forEach(s => {
      console.log(`     ${s.url} -> ${s.fileUrl}`);
    });
  }
  
  return data;
}

/**
 * List available profiles from Remote Browser API
 */
async function listRemoteProfiles(provider = 'adspower', page = 1, pageSize = 200) {
  const params = new URLSearchParams({
    provider: provider,
    page: page.toString(),
    pageSize: pageSize.toString()
  });
  
  const data = await makeRequest(`/profiles/list?${params}`);
  
  return {
    profiles: data.profiles,
    total: data.total,
    page: data.page,
    pageSize: data.pageSize
  };
}

/**
 * Check if Remote Browser API is available
 */
async function checkRemoteBrowserAPI() {
  try {
    const data = await makeRequest('/browsers/status');
    const adspowerProvider = data.providers?.find(p => p.name === 'adspower');
    
    if (adspowerProvider && adspowerProvider.status === 'OK') {
      console.log('✅ Remote Browser API: AdsPower available');
      return true;
    } else {
      console.warn('⚠️  Remote Browser API: AdsPower not available');
      return false;
    }
  } catch (error) {
    console.error('❌ Remote Browser API: Connection failed:', error.message);
    return false;
  }
}

module.exports = {
  startRemoteBrowser,
  stopRemoteBrowser,
  listRemoteProfiles,
  checkRemoteBrowserAPI,
  REMOTE_BROWSER_API_URL,
  isConfigured: () => !!REMOTE_BROWSER_API_KEY
};
