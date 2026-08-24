#!/usr/bin/env node
/**
 * Otto QA Runner - Local AdsPower Profile Browser Automation
 * 
 * This runner:
 * - Reads a JSON config file path from CLI arguments
 * - Uses existing AdsPower profile IDs only (never creates/deletes profiles)
 * - Connects to AdsPower Local API at http://local.adspower.com:50325
 * - Starts profiles, connects via CDP websocket, opens tabs, visits site
 * - Accepts cookie dialogs, searches keywords, scrolls, selects Nth product
 * - Optionally adds/removes items from cart for QA testing only
 * - Stops on CAPTCHA/challenge detection
 * - Never performs checkout, payment, or credential entry
 * - Stops profiles in finally block
 * - Runs profiles concurrently with bounded worker count
 * - Writes detailed JSON report
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

// Configuration constants
const ADSPOWER_API_BASE = 'http://local.adspower.com:50325';
const MAX_CONCURRENT_WORKERS = 3;
const DEFAULT_TIMEOUT = 30000;

// Wait profiles for varied timing
const WAIT_PROFILES = {
  'human-varied': {
    short: () => randomWait(800, 2500),
    medium: () => randomWait(2000, 4500),
    long: () => randomWait(3500, 7000),
    scroll: () => randomWait(1200, 3000)
  },
  'standard': {
    short: () => randomWait(1000, 1500),
    medium: () => randomWait(2000, 3000),
    long: () => randomWait(3000, 4000),
    scroll: () => randomWait(1500, 2000)
  }
};

/**
 * Random wait utility
 */
function randomWait(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate URL format
 */
function isValidURL(str) {
  if (!str || typeof str !== 'string') return false;
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate configuration structure
 */
function validateConfig(config) {
  const errors = [];
  
  if (!config.site_url || !isValidURL(config.site_url)) {
    errors.push('Invalid or missing site_url');
  }
  
  if (config.product_url && !isValidURL(config.product_url)) {
    errors.push('Invalid product_url');
  }
  
  if (!Array.isArray(config.profiles) || config.profiles.length === 0) {
    errors.push('No profiles specified');
  }
  
  if (!config.search || (config.search.keywords === undefined && !config.product_url)) {
    errors.push('Search keywords are required when product_url is not supplied');
  }
  
  if (config.search?.result_position !== undefined && config.search.result_position !== null && config.search.result_position !== '' && config.search.result_position < 1) {
    errors.push('Invalid result_position');
  }
  
  if (!config.wait_profile || !WAIT_PROFILES[config.wait_profile]) {
    errors.push(`Invalid wait_profile. Must be one of: ${Object.keys(WAIT_PROFILES).join(', ')}`);
  }
  
  return errors;
}

/**
 * Call AdsPower Local API
 */
async function adsPowerAPI(endpoint, params = {}) {
  const url = new URL(endpoint, ADSPOWER_API_BASE);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  const response = await fetch(url.toString());
  const data = await response.json();
  
  if (!response.ok || (data.code !== 0 && data.code !== '0')) {
    throw new Error(`AdsPower API error: ${data.msg || response.statusText}`);
  }
  
  return data;
}

/**
 * Start an AdsPower profile and get CDP connection details
 */
async function startProfile(profileId) {
  console.log(`[${profileId}] Starting profile...`);
  const result = await adsPowerAPI('/api/v1/browser/start', {
    user_id: profileId,
    open_tabs: '0'
  });
  
  if (!result.data || !result.data.ws || !result.data.ws.puppeteer) {
    throw new Error(`Failed to start profile ${profileId}: No CDP URL returned`);
  }
  
  return {
    debugPort: result.data.debug_port,
    wsUrl: result.data.ws.puppeteer,
    webdriver: result.data.webdriver
  };
}

/**
 * Stop an AdsPower profile
 */
async function stopProfile(profileId) {
  console.log(`[${profileId}] Stopping profile...`);
  try {
    await adsPowerAPI('/api/v1/browser/stop', { user_id: profileId });
    console.log(`[${profileId}] Profile stopped successfully`);
  } catch (err) {
    console.error(`[${profileId}] Error stopping profile:`, err.message);
  }
}

/**
 * Check if page contains CAPTCHA or challenge
 */
async function detectCAPTCHA(page) {
  try {
    const captchaSelectors = [
      'iframe[src*="recaptcha"]',
      'iframe[src*="hcaptcha"]',
      'div[class*="captcha"]',
      'div[id*="captcha"]',
      '#challenge-form',
      '.g-recaptcha',
      '[data-sitekey]'
    ];
    
    for (const selector of captchaSelectors) {
      const element = await page.$(selector);
      if (element) {
        return true;
      }
    }
    
    const bodyText = await page.evaluate(() => document.body.textContent.toLowerCase());
    const challengeKeywords = ['verify you are human', 'complete the captcha', 'security check', 'prove you\'re not a robot'];
    
    return challengeKeywords.some(keyword => bodyText.includes(keyword));
  } catch {
    return false;
  }
}

/**
 * Accept cookie consent dialogs
 */
async function acceptCookies(page, waits) {
  console.log('  → Checking for cookie consent dialogs...');
  
  const cookieSelectors = [
    'button[id*="accept"]',
    'button[class*="accept"]',
    'button:has-text("Akzeptieren")',
    'button:has-text("Alle akzeptieren")',
    'button:has-text("Accept")',
    'button:has-text("Accept all")',
    'a[id*="accept"]',
    'a[class*="accept"]',
    '#onetrust-accept-btn-handler',
    '.cookie-accept',
    '[data-testid*="accept"]'
  ];
  
  await sleep(waits.short());
  
  for (const selector of cookieSelectors) {
    try {
      const button = await page.$(selector);
      if (button) {
        const isVisible = await button.isVisible().catch(() => false);
        if (isVisible) {
          await button.click();
          console.log('  → Cookie consent accepted');
          await sleep(waits.short());
          return true;
        }
      }
    } catch (err) {
      // Continue to next selector
    }
  }
  
  console.log('  → No cookie dialog found');
  return false;
}

/**
 * Search for keywords on the site
 */
async function searchKeywords(page, keywords, waits) {
  console.log(`  → Searching for: "${keywords}"`);
  
  const searchSelectors = [
    'input[placeholder*="Wonach suchst du"]',
    'input[name="search"]',
    'input[type="search"]',
    'input[id*="search"]',
    'input[class*="search"]',
    'input[aria-label*="search" i]',
    'input[placeholder*="Search"]',
    'input[placeholder*="Suche"]'
  ];
  
  let searchInput = null;
  
  for (const selector of searchSelectors) {
    try {
      searchInput = await page.$(selector);
      if (searchInput) {
        const isVisible = await searchInput.isVisible().catch(() => false);
        if (isVisible) {
          console.log(`  → Found search input with selector: ${selector}`);
          break;
        }
      }
    } catch (err) {
      // Continue to next selector
    }
  }
  
  if (!searchInput) {
    throw new Error('Could not find search input field');
  }
  
  await searchInput.click();
  await sleep(waits.short());
  
  // Type keywords character by character for human-like behavior
  for (const char of keywords) {
    await searchInput.type(char);
    await sleep(randomWait(50, 150));
  }
  
  await sleep(waits.short());
  
  // Submit search - try pressing Enter first
  await page.keyboard.press('Enter');
  await sleep(waits.medium());
  
  console.log('  → Search submitted');
}

/**
 * Perform varied scrolling
 */
async function performScrolling(page, minScrolls, maxScrolls, waits) {
  const scrollCount = Math.floor(Math.random() * (maxScrolls - minScrolls + 1)) + minScrolls;
  console.log(`  → Performing ${scrollCount} scrolls`);
  
  for (let i = 0; i < scrollCount; i++) {
    const scrollAmount = Math.floor(Math.random() * 400) + 200;
    await page.evaluate((amount) => {
      window.scrollBy(0, amount);
    }, scrollAmount);
    await sleep(waits.scroll());
  }
  
  console.log('  → Scrolling completed');
}

/**
 * Select Nth product from search results
 */
async function selectNthProduct(page, position, waits) {
  const requestedPosition = position || 1;
  console.log(`  → Looking for product at position ${requestedPosition}`);
  
  const productSelectors = [
    'a[href*="/p/"]',
    'a[data-testid*="product"]',
    'article a',
    '.product a',
    '[class*="product"] a',
    'a[class*="ProductTile"]'
  ];
  
  await sleep(waits.medium());
  
  for (const selector of productSelectors) {
    try {
      const links = await page.$$(selector);
      
      if (links.length >= requestedPosition) {
        const targetLink = links[requestedPosition - 1];
        const href = await targetLink.evaluate(el => el.href);
        
        if (href && href.includes('/p/')) {
          console.log(`  → Found product link at position ${requestedPosition}: ${href}`);
          await targetLink.click();
          await sleep(waits.long());
          return href;
        }
      }
    } catch (err) {
      // Continue to next selector
    }
  }
  
  throw new Error(`Could not find product at position ${requestedPosition}`);
}

/**
 * Add product to cart (QA only)
 */
async function addToCart(page, waits) {
  console.log('  → Attempting to add product to cart (QA test)');
  
  const addToCartSelectors = [
    'button[data-testid*="add-to-cart"]',
    'button[data-testid*="addToCart"]',
    'button:has-text("In den Warenkorb")',
    'button:has-text("Warenkorb")',
    'button[class*="addToCart"]',
    'button[id*="addToCart"]',
    '.add-to-cart button',
    '[data-qa*="add-to-cart"]'
  ];
  
  await sleep(waits.medium());
  
  for (const selector of addToCartSelectors) {
    try {
      const button = await page.$(selector);
      if (button) {
        const isVisible = await button.isVisible().catch(() => false);
        if (isVisible) {
          await button.click();
          console.log('  → Product added to cart');
          await sleep(waits.medium());
          return true;
        }
      }
    } catch (err) {
      // Continue to next selector
    }
  }
  
  console.log('  → Could not find add-to-cart button');
  return false;
}

/**
 * Remove product from cart (cleanup after QA)
 */
async function removeFromCart(page, waits) {
  console.log('  → Attempting to remove product from cart');
  
  try {
    // Navigate to cart
    const cartSelectors = [
      'a[href*="cart"]',
      'a[href*="warenkorb"]',
      'a[data-testid*="cart"]',
      '.cart-link',
      '[aria-label*="Warenkorb"]'
    ];
    
    for (const selector of cartSelectors) {
      try {
        const cartLink = await page.$(selector);
        if (cartLink) {
          await cartLink.click();
          await sleep(waits.medium());
          break;
        }
      } catch (err) {
        // Continue
      }
    }
    
    // Find and click remove button
    const removeSelectors = [
      'button[data-testid*="remove"]',
      'button:has-text("Entfernen")',
      'button:has-text("Löschen")',
      'button[class*="remove"]',
      '.remove-button',
      '[data-qa*="remove"]'
    ];
    
    for (const selector of removeSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          console.log('  → Product removed from cart');
          await sleep(waits.short());
          return true;
        }
      } catch (err) {
        // Continue
      }
    }
    
    console.log('  → Could not find remove button');
    return false;
  } catch (err) {
    console.error('  → Error removing from cart:', err.message);
    return false;
  }
}

/**
 * Take screenshot
 */
async function takeScreenshot(page, profileId, step, outputDir) {
  try {
    const timestamp = Date.now();
    const filename = `${profileId}_${step}_${timestamp}.png`;
    const filepath = path.join(outputDir, filename);
    
    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`  → Screenshot saved: ${filename}`);
    return filename;
  } catch (err) {
    console.error('  → Screenshot failed:', err.message);
    return null;
  }
}

/**
 * Run QA test on a single profile
 */
async function runProfileTest(profileId, config, outputDir) {
  const result = {
    profile_id: profileId,
    status: 'unknown',
    started_at: new Date().toISOString(),
    completed_at: null,
    error: null,
    steps: [],
    screenshots: []
  };
  
  let browser = null;
  let page = null;
  const waits = WAIT_PROFILES[config.wait_profile];
  
  try {
    console.log(`\n[${profileId}] Starting QA test`);
    
    // Start profile
    const connection = await startProfile(profileId);
    result.steps.push({ step: 'profile_started', timestamp: new Date().toISOString() });
    
    // Connect via CDP
    console.log(`[${profileId}] Connecting to browser via CDP...`);
    browser = await puppeteer.connect({
      browserWSEndpoint: connection.wsUrl,
      defaultViewport: null
    });
    
    // Always use a fresh tab. Existing profile tabs may be private project
    // pages or stale login/session pages and must never be repurposed.
    page = await browser.newPage();
    
    page.setDefaultTimeout(DEFAULT_TIMEOUT);
    result.steps.push({ step: 'browser_connected', timestamp: new Date().toISOString() });
    
    // Navigate to site
    console.log(`[${profileId}] Navigating to ${config.site_url}`);
    await page.goto(config.site_url, { waitUntil: 'domcontentloaded' });
    await sleep(waits.medium());
    result.steps.push({ step: 'site_loaded', timestamp: new Date().toISOString() });
    
    if (config.report.screenshots) {
      const screenshot = await takeScreenshot(page, profileId, 'homepage', outputDir);
      if (screenshot) result.screenshots.push(screenshot);
    }
    
    // Check for CAPTCHA
    if (config.limits.stop_on_captcha) {
      const hasCaptcha = await detectCAPTCHA(page);
      if (hasCaptcha) {
        result.status = 'stopped_captcha';
        result.error = 'CAPTCHA or security challenge detected';
        console.log(`[${profileId}] ⚠️  CAPTCHA detected - stopping as configured`);
        return result;
      }
    }
    
    // Accept cookies
    if (config.actions.accept_cookies) {
      await acceptCookies(page, waits);
      result.steps.push({ step: 'cookies_accepted', timestamp: new Date().toISOString() });
    }
    
    // Search keywords, unless a direct product URL was supplied.
    if (config.product_url) {
      await page.goto(config.product_url, { waitUntil: 'domcontentloaded' });
      await sleep(waits.medium());
      result.steps.push({ step: 'product_direct_loaded', timestamp: new Date().toISOString(), url: config.product_url });
    } else {
      await searchKeywords(page, config.search.keywords, waits);
      result.steps.push({ step: 'search_completed', timestamp: new Date().toISOString() });
    }
    
    if (config.report.screenshots) {
      const screenshot = await takeScreenshot(page, profileId, 'search_results', outputDir);
      if (screenshot) result.screenshots.push(screenshot);
    }
    
    // Scroll search results
    if (config.actions.scroll.enabled) {
      await performScrolling(
        page,
        config.actions.scroll.min,
        config.actions.scroll.max,
        waits
      );
      result.steps.push({ step: 'scrolling_completed', timestamp: new Date().toISOString() });
    }
    
    // Select Nth product when searching; otherwise use the supplied URL.
    const productUrl = config.product_url || await selectNthProduct(page, config.search.result_position, waits);
    result.product_url = productUrl;
    result.steps.push({ step: 'product_selected', timestamp: new Date().toISOString(), url: productUrl });
    
    if (config.report.screenshots) {
      const screenshot = await takeScreenshot(page, profileId, 'product_page', outputDir);
      if (screenshot) result.screenshots.push(screenshot);
    }
    
    // Check for CAPTCHA on product page
    if (config.limits.stop_on_captcha) {
      const hasCaptcha = await detectCAPTCHA(page);
      if (hasCaptcha) {
        result.status = 'stopped_captcha';
        result.error = 'CAPTCHA detected on product page';
        console.log(`[${profileId}] ⚠️  CAPTCHA detected on product page - stopping`);
        return result;
      }
    }
    
    // Scroll product page
    if (config.actions.scroll.enabled) {
      await performScrolling(
        page,
        config.actions.scroll.min,
        config.actions.scroll.max,
        waits
      );
    }
    
    // Add to cart (QA only)
    if (config.actions.add_to_cart) {
      const added = await addToCart(page, waits);
      if (added) {
        result.steps.push({ step: 'added_to_cart', timestamp: new Date().toISOString() });
        
        if (config.report.screenshots) {
          const screenshot = await takeScreenshot(page, profileId, 'cart_added', outputDir);
          if (screenshot) result.screenshots.push(screenshot);
        }
        
        // Remove from cart if configured
        if (config.actions.remove_after_test) {
          await sleep(waits.medium());
          const removed = await removeFromCart(page, waits);
          if (removed) {
            result.steps.push({ step: 'removed_from_cart', timestamp: new Date().toISOString() });
          }
        }
      }
    }
    
    result.status = 'completed';
    console.log(`[${profileId}] ✓ Test completed successfully`);
    
  } catch (err) {
    result.status = 'failed';
    result.error = err.message;
    console.error(`[${profileId}] ✗ Test failed:`, err.message);
  } finally {
    result.completed_at = new Date().toISOString();
    
    // Cleanup
    if (config.cleanup.close_tabs && page) {
      try {
        await page.close();
      } catch (err) {
        console.error(`[${profileId}] Error closing page:`, err.message);
      }
    }
    
    if (browser) {
      try {
        await browser.disconnect();
      } catch (err) {
        console.error(`[${profileId}] Error disconnecting browser:`, err.message);
      }
    }
    
    // Always stop profile
    if (config.cleanup.stop_profiles) {
      await stopProfile(profileId);
    }
  }
  
  return result;
}

/**
 * Run tests concurrently with bounded worker pool
 */
async function runConcurrentTests(profiles, config, outputDir, onProgress = null) {
  const results = [];
  const queue = [...profiles];
  const workers = [];
  
  console.log(`\n🚀 Starting ${profiles.length} profile tests with ${MAX_CONCURRENT_WORKERS} concurrent workers\n`);
  
  async function worker() {
    while (queue.length > 0) {
      const profileId = queue.shift();
      if (profileId) {
        const result = await runProfileTest(profileId, config, outputDir);
        results.push(result);
        if (onProgress) onProgress({ profile_id: profileId, status: result.status, result });
      }
    }
  }
  
  // Start workers
  for (let i = 0; i < Math.min(MAX_CONCURRENT_WORKERS, profiles.length); i++) {
    workers.push(worker());
  }
  
  // Wait for all workers to complete
  await Promise.all(workers);
  
  return results;
}

async function runConfig(config, options = {}) {
  const validationErrors = validateConfig(config);
  if (validationErrors.length > 0) {
    throw new Error(`Configuration validation failed: ${validationErrors.join('; ')}`);
  }
  const outputDir = options.outputDir || path.join(process.cwd(), 'screenshots');
  if (config.report?.screenshots) fs.mkdirSync(outputDir, { recursive: true });
  const startTime = Date.now();
  const results = await runConcurrentTests(config.profiles, config, outputDir, options.onProgress);
  return {
    test_name: config.test_name || 'Otto QA Run',
    started_at: new Date(startTime).toISOString(),
    completed_at: new Date().toISOString(),
    duration_seconds: Number(((Date.now() - startTime) / 1000).toFixed(2)),
    config: { site_url: config.site_url, search_keywords: config.search.keywords, profiles: config.profiles },
    summary: {
      total: results.length,
      completed: results.filter(r => r.status === 'completed').length,
      failed: results.filter(r => r.status === 'failed').length,
      stopped_captcha: results.filter(r => r.status === 'stopped_captcha').length
    },
    results
  };
}

/**
 * Main entry point
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║        Otto QA Runner - AdsPower Automation          ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  // Parse arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node otto-runner.cjs <config.json> [output-report.json]\n');
    console.log('Arguments:');
    console.log('  config.json         Path to JSON configuration file (required)');
    console.log('  output-report.json  Path to write report JSON (default: report-{timestamp}.json)\n');
    console.log('Example:');
    console.log('  node otto-runner.cjs sample-config.json results.json\n');
    process.exit(0);
  }
  
  const configPath = args[0];
  const reportPath = args[1] || `report-${Date.now()}.json`;
  
  // Validate config file exists
  if (!fs.existsSync(configPath)) {
    console.error(`✗ Configuration file not found: ${configPath}`);
    process.exit(1);
  }
  
  // Load and parse config
  console.log(`📄 Loading configuration from: ${configPath}`);
  let config;
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
  } catch (err) {
    console.error(`✗ Failed to parse configuration file: ${err.message}`);
    process.exit(1);
  }
  
  // Validate config
  const validationErrors = validateConfig(config);
  if (validationErrors.length > 0) {
    console.error('\n✗ Configuration validation failed:\n');
    validationErrors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
  
  console.log('✓ Configuration validated\n');
  console.log(`Site: ${config.site_url}`);
  console.log(`Keywords: "${config.search.keywords}"`);
  console.log(`Profiles: ${config.profiles.join(', ')}`);
  console.log(`Result position: ${config.search.result_position || 'first suitable result'}`);
  console.log(`Wait profile: ${config.wait_profile}`);
  console.log(`Add to cart: ${config.actions.add_to_cart ? 'Yes' : 'No'}`);
  console.log(`Stop on CAPTCHA: ${config.limits.stop_on_captcha ? 'Yes' : 'No'}`);
  
  // Create output directory for screenshots
  const outputDir = path.join(process.cwd(), 'screenshots');
  if (config.report.screenshots) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    console.log(`Screenshots: ${outputDir}`);
  }
  
  const startTime = Date.now();
  
  // Run tests
  const results = await runConcurrentTests(config.profiles, config, outputDir);
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Generate report
  const report = {
    test_name: config.test_name || 'Otto QA Run',
    started_at: new Date(startTime).toISOString(),
    completed_at: new Date(endTime).toISOString(),
    duration_seconds: parseFloat(duration),
    config: {
      site_url: config.site_url,
      search_keywords: config.search.keywords,
      profiles: config.profiles
    },
    summary: {
      total: results.length,
      completed: results.filter(r => r.status === 'completed').length,
      failed: results.filter(r => r.status === 'failed').length,
      stopped_captcha: results.filter(r => r.status === 'stopped_captcha').length
    },
    results
  };
  
  // Write report
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║                    Test Summary                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  console.log(`Duration: ${duration}s`);
  console.log(`Total profiles: ${report.summary.total}`);
  console.log(`✓ Completed: ${report.summary.completed}`);
  console.log(`✗ Failed: ${report.summary.failed}`);
  console.log(`⚠️  Stopped (CAPTCHA): ${report.summary.stopped_captcha}`);
  console.log(`\n📊 Report saved to: ${reportPath}\n`);
  
  // Exit with appropriate code
  process.exit(report.summary.failed > 0 ? 1 : 0);
}

// Run if executed directly
if (require.main === module) {
  main().catch(err => {
    console.error('\n✗ Fatal error:', err.message);
    console.error(err.stack);
    process.exit(1);
  });
}

module.exports = { main, validateConfig, isValidURL, runConfig };
