/**
 * Manual Login Helper
 * Opens a browser profile, navigates to Otto.de, waits for user to log in manually
 */

const puppeteer = require('puppeteer-core');
const { startProfile, stopProfile } = require('./remote-browser-client.cjs');

/**
 * Check if user is logged in to Otto.de
 */
async function checkOttoLoginStatus(page) {
  try {
    // Check for "Mein Konto" with user name or logged-in indicators
    const loggedInIndicators = [
      'a[href*="/meinekonto"]',
      'button:has-text("Mein Konto")',
      '[data-qa*="user-menu"]',
      '.user-menu',
      '[aria-label*="Konto"]'
    ];
    
    for (const selector of loggedInIndicators) {
      const element = await page.$(selector);
      if (element) {
        const text = await page.evaluate(el => el.textContent, element);
        // If it's not just "Anmelden" or "Login", user is logged in
        if (text && !text.includes('Anmelden') && !text.includes('Login')) {
          return { loggedIn: true, indicator: selector, text };
        }
      }
    }
    
    // Check for user email or name in page
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasUserEmail = /@/.test(bodyText);
    
    return { loggedIn: hasUserEmail, indicator: 'email-in-page' };
  } catch (error) {
    console.error('Error checking login status:', error);
    return { loggedIn: false, error: error.message };
  }
}

/**
 * Manual login flow
 * Opens browser, navigates to Otto.de, waits for user confirmation
 */
async function manualLoginFlow(profileId, provider = 'adspower', options = {}) {
  const {
    siteUrl = 'https://www.otto.de',
    timeout = 600000, // 10 minutes
    onWaiting = null, // Callback when waiting for user
    onComplete = null, // Callback when done
  } = options;
  
  console.log(`\n[Manual Login] Starting for profile ${profileId} (${provider})`);
  
  let browser = null;
  let page = null;
  let connection = null;
  
  try {
    // 1. Start profile
    console.log('[Manual Login] Starting browser profile...');
    connection = await startProfile(profileId, provider);
    
    // 2. Connect via CDP
    console.log('[Manual Login] Connecting to browser...');
    const puppeteerUrl = connection.puppeteerUrl || connection.ws.puppeteer;
    
    browser = await puppeteer.connect({
      browserWSEndpoint: puppeteerUrl,
      defaultViewport: null
    });
    
    const pages = await browser.pages();
    page = pages.length > 0 ? pages[0] : await browser.newPage();
    
    // 3. Navigate to Otto.de
    console.log(`[Manual Login] Navigating to ${siteUrl}...`);
    await page.goto(siteUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // 4. Accept cookies if present
    console.log('[Manual Login] Checking for cookie banner...');
    try {
      const cookieButton = await page.$('button:has-text("Alle akzeptieren"), button#onetrust-accept-btn-handler');
      if (cookieButton) {
        await cookieButton.click();
        await page.waitForTimeout(1000);
        console.log('[Manual Login] ✓ Cookies accepted');
      }
    } catch (e) {
      // Cookie banner not found or already accepted
    }
    
    // 5. Notify user to log in
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  🔐 MANUAL LOGIN REQUIRED                            ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('');
    console.log('  The browser is now open at Otto.de.');
    console.log('');
    console.log('  ➡️  Please log in to your Otto.de account manually.');
    console.log('  ➡️  Complete any 2FA or verification steps.');
    console.log('  ➡️  When logged in, return here and confirm.');
    console.log('');
    console.log('  Waiting for confirmation...');
    console.log('');
    
    if (onWaiting) {
      onWaiting({ profileId, provider, url: siteUrl });
    }
    
    // 6. Return waiting state (will be confirmed via API)
    return {
      status: 'waiting',
      profileId,
      provider,
      browserId: connection.browserId,
      message: 'Browser open, waiting for user to log in and confirm',
      timeout: timeout,
      startedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('[Manual Login] Error:', error);
    
    // Cleanup on error
    if (connection) {
      try {
        await stopProfile(profileId, connection.browserId, provider);
      } catch (e) {
        console.error('[Manual Login] Error stopping profile:', e);
      }
    }
    
    throw error;
  }
}

/**
 * Verify login after user confirms
 */
async function verifyLogin(profileId, provider = 'adspower', browserId) {
  console.log(`\n[Manual Login] Verifying login for profile ${profileId}...`);
  
  let browser = null;
  
  try {
    // Reconnect to the browser
    const connection = { browserId, provider };
    
    // Get puppeteer URL (we need to reconnect)
    // For now, we'll use the remote browser API to get the connection
    const { startProfile: getConnection } = require('./remote-browser-client.cjs');
    const activeConnection = await getConnection(profileId, provider);
    
    const puppeteerUrl = activeConnection.puppeteerUrl || activeConnection.ws.puppeteer;
    
    browser = await puppeteer.connect({
      browserWSEndpoint: puppeteerUrl,
      defaultViewport: null
    });
    
    const pages = await browser.pages();
    const page = pages[0];
    
    // Check login status
    const loginStatus = await checkOttoLoginStatus(page);
    
    if (loginStatus.loggedIn) {
      console.log('[Manual Login] ✅ Login verified!');
      console.log(`[Manual Login] Indicator: ${loginStatus.indicator}`);
      
      return {
        success: true,
        loggedIn: true,
        verifiedAt: new Date().toISOString(),
        indicator: loginStatus.indicator,
        text: loginStatus.text
      };
    } else {
      console.log('[Manual Login] ⚠️  Login not detected');
      
      return {
        success: false,
        loggedIn: false,
        message: 'Could not verify login. Please ensure you are logged in.'
      };
    }
    
  } catch (error) {
    console.error('[Manual Login] Error verifying:', error);
    throw error;
  }
}

/**
 * Complete manual login (verify and stop browser)
 */
async function completeManualLogin(profileId, provider, browserId, keepBrowserOpen = false) {
  console.log(`\n[Manual Login] Completing login for profile ${profileId}...`);
  
  try {
    // Verify login
    const verification = await verifyLogin(profileId, provider, browserId);
    
    if (!verification.loggedIn) {
      return {
        success: false,
        error: 'Login verification failed',
        ...verification
      };
    }
    
    // Stop browser (unless keeping open)
    if (!keepBrowserOpen) {
      console.log('[Manual Login] Closing browser...');
      await stopProfile(profileId, browserId, provider);
    }
    
    console.log('[Manual Login] ✅ Manual login complete!');
    
    return {
      success: true,
      profileId,
      provider,
      loggedIn: true,
      verifiedAt: verification.verifiedAt,
      browserOpen: keepBrowserOpen
    };
    
  } catch (error) {
    console.error('[Manual Login] Error completing:', error);
    throw error;
  }
}

module.exports = {
  manualLoginFlow,
  verifyLogin,
  completeManualLogin,
  checkOttoLoginStatus
};
