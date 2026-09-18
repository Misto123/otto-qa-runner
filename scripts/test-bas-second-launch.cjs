#!/usr/bin/env node
/**
 * BAS Second Launch Test - Real API Response Logger
 * 
 * This script will:
 * 1. Create a BAS profile
 * 2. Launch browser (first time)
 * 3. Stop browser
 * 4. Launch browser again (second time) - THIS SHOULD FAIL
 * 5. Log all actual API responses
 * 
 * Run: node scripts/test-bas-second-launch.cjs
 */

// Use global fetch (Node.js 18+)
const fetch = globalThis.fetch;

const REMOTE_BROWSER_API_URL = process.env.REMOTE_BROWSER_API_URL || 'http://65.21.199.228:3000';
const REMOTE_BROWSER_API_KEY = process.env.REMOTE_BROWSER_API_KEY || 'JTYDA_7531D_98HGTR_YT154';

// BAS proxy (simple format without http:// or URL encoding)
const BAS_PROXY = 'ottovisits;p=1:LfjlMN)S*Cy74*_r@proxy2.rebelinternet.eu:5001';

/**
 * Make request and log everything
 */
async function makeRequestWithLogging(endpoint, options = {}) {
  const url = `${REMOTE_BROWSER_API_URL}${endpoint}`;
  
  console.log('\n' + '━'.repeat(70));
  console.log(`📡 API REQUEST: ${options.method || 'GET'} ${endpoint}`);
  console.log('━'.repeat(70));
  
  console.log('\n📤 Request URL:');
  console.log(`   ${url}`);
  
  console.log('\n📤 Request Headers:');
  console.log(JSON.stringify({
    'Content-Type': 'application/json',
    'x_api_key': REMOTE_BROWSER_API_KEY,
    ...options.headers
  }, null, 2));
  
  if (options.body) {
    console.log('\n📤 Request Body:');
    console.log(options.body);
  }
  
  const startTime = Date.now();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x_api_key': REMOTE_BROWSER_API_KEY,
      ...options.headers
    }
  });
  
  const duration = Date.now() - startTime;
  
  console.log('\n📥 Response Status:');
  console.log(`   HTTP ${response.status} ${response.statusText}`);
  console.log(`   Duration: ${duration}ms`);
  
  const responseText = await response.text();
  let result;
  
  try {
    result = JSON.parse(responseText);
    console.log('\n📥 Response Body:');
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.log('\n📥 Response Body (Raw):');
    console.log(responseText);
    result = { error: 'Invalid JSON response', raw: responseText };
  }
  
  console.log('\n' + '━'.repeat(70));
  
  return {
    status: response.status,
    ok: response.ok,
    result
  };
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main test
 */
async function runTest() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                                                               ║');
  console.log('║     BAS SECOND LAUNCH TEST - REAL API RESPONSE LOGGER        ║');
  console.log('║                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log('📅 Test started:', new Date().toISOString());
  console.log('🌐 API URL:', REMOTE_BROWSER_API_URL);
  console.log('🔑 API Key:', REMOTE_BROWSER_API_KEY.substring(0, 10) + '...');
  console.log('🔗 Proxy:', BAS_PROXY.substring(0, 50) + '...');
  
  let profileId = null;
  let browserId1 = null;
  let browserId2 = null;
  
  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: Create BAS Profile (if needed)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    console.log('\n\n🔷 STEP 1: Create BAS Profile (Optional)');
    console.log('━'.repeat(70));
    console.log('Note: BAS profiles are created automatically on first launch');
    console.log('We will use a numeric profile ID (e.g., 1, 2, 3...)');
    
    // For BAS, we use a numeric ID as STRING (API expects string)
    profileId = String(Math.floor(Math.random() * 10000) + 1000); // Random ID "1000"-"10999"
    console.log(`\n✅ Using Profile ID: ${profileId} (type: ${typeof profileId})`);
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: First Browser Launch
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    console.log('\n\n🔷 STEP 2: First Browser Launch');
    console.log('━'.repeat(70));
    console.log('Expected: ✅ SUCCESS');
    
    const launch1 = await makeRequestWithLogging('/browsers/start', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'bas',
        timeout: 1800000,
        clientId: 'otto-qa-runner-test',
        proxy: BAS_PROXY,
        profileId: profileId
      })
    });
    
    if (launch1.result.success) {
      browserId1 = launch1.result.data.browserId;
      console.log(`\n✅ FIRST LAUNCH: SUCCESS`);
      console.log(`   Browser ID: ${browserId1}`);
      console.log(`   WebSocket: ${launch1.result.data.puppeteerUrl?.substring(0, 60)}...`);
      console.log(`   Timeout: ${launch1.result.data.timeout}ms`);
    } else {
      console.log(`\n❌ FIRST LAUNCH: FAILED (unexpected!)`);
      console.log(`   Error: ${launch1.result.error}`);
      console.log('\n⚠️  Test cannot continue without successful first launch');
      return;
    }
    
    // Wait a bit for browser to fully start
    console.log('\n⏳ Waiting 5 seconds for browser to fully initialize...');
    await sleep(5000);
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: Stop Browser
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    console.log('\n\n🔷 STEP 3: Stop Browser');
    console.log('━'.repeat(70));
    console.log('Expected: ✅ SUCCESS');
    
    const stop = await makeRequestWithLogging('/browsers/stop', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'bas',
        browserId: browserId1
      })
    });
    
    if (stop.result.success) {
      console.log(`\n✅ BROWSER STOPPED: SUCCESS`);
      console.log(`   Browser ID: ${browserId1}`);
    } else {
      console.log(`\n⚠️  BROWSER STOP: FAILED OR ALREADY STOPPED`);
      console.log(`   Error: ${stop.result.error || 'Unknown'}`);
    }
    
    // Wait to ensure cleanup
    console.log('\n⏳ Waiting 3 seconds for cleanup...');
    await sleep(3000);
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 4: Second Browser Launch (SAME PROFILE)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    console.log('\n\n🔷 STEP 4: Second Browser Launch (SAME PROFILE)');
    console.log('━'.repeat(70));
    console.log('Expected: ❌ FAILURE - "Failed to start browser"');
    console.log(`Using same Profile ID: ${profileId}`);
    
    const launch2 = await makeRequestWithLogging('/browsers/start', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'bas',
        timeout: 1800000,
        clientId: 'otto-qa-runner-test',
        proxy: BAS_PROXY,
        profileId: profileId  // ← SAME PROFILE AS BEFORE
      })
    });
    
    if (launch2.result.success) {
      browserId2 = launch2.result.data.browserId;
      console.log(`\n✅ SECOND LAUNCH: SUCCESS (unexpected!)`);
      console.log(`   Browser ID: ${browserId2}`);
      console.log(`   THIS IS UNEXPECTED - THE BUG MAY BE FIXED!`);
    } else {
      console.log(`\n❌ SECOND LAUNCH: FAILED (as expected)`);
      console.log(`   Error: ${launch2.result.error}`);
      console.log(`   This confirms the server-side cleanup issue`);
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 5: Verify with NEW Profile
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    console.log('\n\n🔷 STEP 5: Verify with NEW Profile');
    console.log('━'.repeat(70));
    console.log('Expected: ✅ SUCCESS - Proves issue is with profile reuse');
    
    const newProfileId = profileId + 1;
    console.log(`Using NEW Profile ID: ${newProfileId}`);
    
    const launch3 = await makeRequestWithLogging('/browsers/start', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'bas',
        timeout: 1800000,
        clientId: 'otto-qa-runner-test',
        proxy: BAS_PROXY,
        profileId: newProfileId  // ← NEW PROFILE
      })
    });
    
    if (launch3.result.success) {
      const browserId3 = launch3.result.data.browserId;
      console.log(`\n✅ NEW PROFILE LAUNCH: SUCCESS`);
      console.log(`   Browser ID: ${browserId3}`);
      console.log(`   This proves the issue is with session cleanup,`);
      console.log(`   NOT with our code or proxy configuration.`);
      
      // Clean up new browser
      console.log('\n⏳ Cleaning up test browser...');
      await sleep(2000);
      await makeRequestWithLogging('/browsers/stop', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'bas',
          browserId: browserId3
        })
      });
    } else {
      console.log(`\n❌ NEW PROFILE LAUNCH: FAILED (unexpected!)`);
      console.log(`   Error: ${launch3.result.error}`);
    }
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST SUMMARY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  console.log('\n\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log('Profile ID Used:', profileId);
  console.log('First Browser ID:', browserId1 || 'N/A');
  console.log('Second Browser ID:', browserId2 || 'N/A (failed as expected)');
  
  console.log('\n✅ Test completed!');
  console.log('📄 Check the logs above for actual API responses\n');
}

// Run test
if (require.main === module) {
  runTest().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTest };
