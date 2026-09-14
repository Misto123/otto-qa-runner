/**
 * Otto.de Automated Registration
 * Creates accounts automatically with Playwright automation
 */

const puppeteer = require('puppeteer-core');
const { startProfile, stopProfile } = require('./remote-browser-client.cjs');
const { tagProfileLoggedIn } = require('./profile-metadata.cjs');

/**
 * Register a new Otto.de account
 * @param {Object} accountData - Account details
 * @param {string} accountData.email
 * @param {string} accountData.firstName
 * @param {string} accountData.lastName
 * @param {string} accountData.password
 * @param {string} accountData.address
 * @param {string} accountData.zipCode
 * @param {string} accountData.city
 * @param {string} accountData.phone
 * @param {string} profileId - AdsPower profile ID
 * @param {string} provider - Browser provider (adspower/bas)
 */
async function registerOttoAccount(accountData, profileId, provider = 'adspower') {
  console.log(`\n[Otto Register] Starting registration for ${accountData.email}`);
  
  let browser = null;
  let connection = null;
  
  try {
    // Start profile
    console.log('[Otto Register] Starting browser profile...');
    connection = await startProfile(profileId, provider);
    
    const puppeteerUrl = connection.puppeteerUrl || connection.ws.puppeteer;
    browser = await puppeteer.connect({
      browserWSEndpoint: puppeteerUrl,
      defaultViewport: null
    });
    
    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();
    
    // Navigate to Otto.de
    console.log('[Otto Register] Navigating to Otto.de...');
    await page.goto('https://www.otto.de', { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Accept cookies
    console.log('[Otto Register] Accepting cookies...');
    try {
      const cookieButton = await page.$('button#onetrust-accept-btn-handler, button:has-text("Alle akzeptieren")');
      if (cookieButton) {
        await cookieButton.click();
        await page.waitForTimeout(1500);
      }
    } catch (e) {
      console.log('[Otto Register] Cookie banner not found or already accepted');
    }
    
    // Find and click account/login link
    console.log('[Otto Register] Looking for account menu...');
    const accountSelectors = [
      'a:has-text("Mein Konto")',
      'button:has-text("Mein Konto")',
      'a[href*="login"]',
      '[data-qa*="account"]'
    ];
    
    let accountLink = null;
    for (const selector of accountSelectors) {
      const el = await page.$(selector);
      if (el) {
        accountLink = el;
        break;
      }
    }
    
    if (accountLink) {
      console.log('[Otto Register] Clicking account link...');
      await accountLink.click();
      await page.waitForTimeout(3000);
    }
    
    // Look for registration link
    console.log('[Otto Register] Looking for registration option...');
    const registerSelectors = [
      'a:has-text("Registrieren")',
      'a:has-text("Jetzt registrieren")',
      'a:has-text("Neu hier")',
      'button:has-text("Registrieren")',
      'a:has-text("Konto erstellen")',
      'a[href*="register"]',
      'a[href*="registrierung"]'
    ];
    
    let registerLink = null;
    for (const selector of registerSelectors) {
      const el = await page.$(selector);
      if (el && await el.isVisible()) {
        registerLink = el;
        console.log(`[Otto Register] Found registration link: ${selector}`);
        break;
      }
    }
    
    if (registerLink) {
      await registerLink.click();
      await page.waitForTimeout(3000);
    }
    
    // Fill registration form
    console.log('[Otto Register] Filling registration form...');
    
    // Wait for form to load
    await page.waitForTimeout(2000);
    
    // Try to fill email
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[id*="email"]',
      'input[placeholder*="E-Mail"]'
    ];
    
    let emailFilled = false;
    for (const selector of emailSelectors) {
      const input = await page.$(selector);
      if (input) {
        await input.type(accountData.email, { delay: 100 });
        console.log(`[Otto Register] ✓ Email filled: ${accountData.email}`);
        emailFilled = true;
        break;
      }
    }
    
    if (!emailFilled) {
      throw new Error('Could not find email input field');
    }
    
    // Fill password
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[id*="password"]',
      'input[placeholder*="Passwort"]'
    ];
    
    const passwordInputs = await page.$$(passwordSelectors.join(','));
    if (passwordInputs.length > 0) {
      await passwordInputs[0].type(accountData.password, { delay: 100 });
      console.log('[Otto Register] ✓ Password filled');
      
      // Confirm password if there's a second field
      if (passwordInputs.length > 1) {
        await passwordInputs[1].type(accountData.password, { delay: 100 });
        console.log('[Otto Register] ✓ Password confirmed');
      }
    }
    
    // Fill first name
    const firstNameSelectors = [
      'input[name*="firstname"]',
      'input[name*="firstName"]',
      'input[id*="firstname"]',
      'input[placeholder*="Vorname"]'
    ];
    
    for (const selector of firstNameSelectors) {
      const input = await page.$(selector);
      if (input) {
        await input.type(accountData.firstName, { delay: 100 });
        console.log(`[Otto Register] ✓ First name filled: ${accountData.firstName}`);
        break;
      }
    }
    
    // Fill last name
    const lastNameSelectors = [
      'input[name*="lastname"]',
      'input[name*="lastName"]',
      'input[id*="lastname"]',
      'input[placeholder*="Nachname"]'
    ];
    
    for (const selector of lastNameSelectors) {
      const input = await page.$(selector);
      if (input) {
        await input.type(accountData.lastName, { delay: 100 });
        console.log(`[Otto Register] ✓ Last name filled: ${accountData.lastName}`);
        break;
      }
    }
    
    // Take screenshot of filled form
    await page.screenshot({ 
      path: `/tmp/otto-register-${profileId}-form.png`,
      fullPage: true 
    });
    
    // Look for submit button
    console.log('[Otto Register] Looking for submit button...');
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Registrieren")',
      'button:has-text("Weiter")',
      'button:has-text("Jetzt registrieren")',
      'input[type="submit"]'
    ];
    
    let submitButton = null;
    for (const selector of submitSelectors) {
      const btn = await page.$(selector);
      if (btn && await btn.isVisible()) {
        submitButton = btn;
        break;
      }
    }
    
    if (submitButton) {
      console.log('[Otto Register] Clicking submit button...');
      await submitButton.click();
      await page.waitForTimeout(5000);
      
      // Check for errors
      const errorSelectors = [
        '.error',
        '[class*="error"]',
        '[role="alert"]',
        '.alert-danger'
      ];
      
      for (const selector of errorSelectors) {
        const error = await page.$(selector);
        if (error && await error.isVisible()) {
          const errorText = await page.evaluate(el => el.textContent, error);
          console.log(`[Otto Register] ⚠️  Error on page: ${errorText}`);
        }
      }
      
      // Take screenshot after submit
      await page.screenshot({ 
        path: `/tmp/otto-register-${profileId}-result.png`,
        fullPage: true 
      });
    } else {
      throw new Error('Could not find submit button');
    }
    
    // Check if registration was successful
    // Look for success indicators
    const currentUrl = page.url();
    console.log(`[Otto Register] Current URL: ${currentUrl}`);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    const isSuccess = bodyText.includes('Willkommen') || 
                      bodyText.includes('erfolgreich') ||
                      currentUrl.includes('success') ||
                      currentUrl.includes('confirmation');
    
    if (isSuccess) {
      console.log('[Otto Register] ✅ Registration appears successful');
      
      // Tag profile as logged in
      tagProfileLoggedIn(profileId, provider, 'otto.de');
      
      return {
        success: true,
        profileId,
        email: accountData.email,
        message: 'Registration completed'
      };
    } else {
      console.log('[Otto Register] ⚠️  Registration status unclear');
      return {
        success: false,
        profileId,
        email: accountData.email,
        message: 'Registration status unclear - manual verification needed'
      };
    }
    
  } catch (error) {
    console.error('[Otto Register] Error:', error);
    
    return {
      success: false,
      profileId,
      email: accountData.email,
      error: error.message
    };
  } finally {
    // Keep browser open for manual verification if needed
    // await stopProfile(profileId, connection.browserId, provider);
    console.log('[Otto Register] Browser left open for verification');
  }
}

/**
 * Create a new profile and register Otto account
 */
async function createProfileAndRegister(accountData, provider = 'adspower') {
  const { createProfile } = require('./remote-browser-client.cjs');
  
  console.log(`\n[Otto Register] Creating new profile for ${accountData.email}`);
  
  try {
    // Create profile with basic config
    const profileConfig = {
      name: `Otto - ${accountData.firstName} ${accountData.lastName}`,
      group_id: '0', // Ungrouped
      remark: `Auto-registered: ${accountData.email}`,
      user_proxy_config: {
        proxy_soft: 'no_proxy' // Use no proxy initially
      },
      fingerprint_config: {
        browser_kernel_config: {
          type: 'chrome',
          version: 'latest'
        }
      }
    };
    
    const profile = await createProfile(profileConfig, provider);
    
    if (!profile || !profile.user_id) {
      throw new Error('Failed to create profile');
    }
    
    console.log(`[Otto Register] ✓ Profile created: ${profile.user_id}`);
    
    // Wait a bit before starting registration
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Register account
    const result = await registerOttoAccount(accountData, profile.user_id, provider);
    
    return {
      ...result,
      profileId: profile.user_id
    };
    
  } catch (error) {
    console.error('[Otto Register] Error creating profile:', error);
    return {
      success: false,
      error: error.message,
      email: accountData.email
    };
  }
}

module.exports = {
  registerOttoAccount,
  createProfileAndRegister
};
