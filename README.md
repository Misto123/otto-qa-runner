# Otto QA Runner

A professional QA automation tool for testing product journeys on Otto.de using AdsPower browser profiles. The tool consists of a web-based configuration generator and a local Node.js runner that integrates with AdsPower's Local API.

## ⚠️ Security Warning: Password Gate

**The web configuration form includes a client-side password gate. This is NOT real security.**

- The password is visible in the HTML source code (line inspection reveals it)
- Anyone with browser DevTools can bypass the gate in seconds
- This is a convenience gate only, meant to prevent accidental access
- **For actual security, use:**
  - Vercel's built-in password protection
  - Server-side authentication
  - Environment-based access controls
  - IP allowlisting

**Do not rely on this client-side gate for protecting sensitive data or production systems.**

## Architecture Overview

This project is split into two components:

### 1. Web Configuration Generator (`index.html`)
- **Deployment**: Can be hosted on Vercel, Netlify, or any static hosting
- **Purpose**: Generates and downloads JSON configuration files
- **Capabilities**: 
  - Create test configurations with a polished UI
  - Save/restore settings in browser localStorage
  - Export JSON configuration files
- **Limitations**: 
  - **Cannot start browsers or execute tests**
  - **Cannot access AdsPower Local API** (runs at `http://local.adspower.com:50325` which is only accessible locally)
  - Only generates configurations for the runner

### 2. Local Runner (`runner/otto-runner.cjs`)
- **Execution**: Must run locally on the same Mac where AdsPower is installed
- **Purpose**: Executes QA tests using existing AdsPower profiles
- **Requirements**:
  - AdsPower application running locally
  - Node.js 18+ installed
  - Access to `http://local.adspower.com:50325`

## Why the Runner Must Execute Locally

The AdsPower Local API runs at `http://local.adspower.com:50325`, which:
- Only responds to requests from `localhost` (127.0.0.1)
- Cannot be accessed from external servers or deployed environments
- Requires the AdsPower application to be running on the same machine

**This means:**
- ✅ The web page (index.html) can be deployed to Vercel for easy configuration generation
- ❌ The runner (otto-runner.cjs) cannot run on Vercel or any remote server
- ✅ The runner must execute on your local Mac where AdsPower is installed

## Installation

### Prerequisites
1. **AdsPower Desktop** installed and running on your Mac
2. **Node.js 18+** installed ([Download](https://nodejs.org/))
3. **Existing AdsPower profiles** (the runner uses existing profiles only, never creates/deletes them)

### Setup

```bash
# Clone or download this repository
cd otto-qa-runner

# Install dependencies
npm install

# Verify the runner syntax
npm run validate
```

## Local companion: Run this test locally

The deployed page can send a validated configuration to a companion running on the same Mac. It cannot run AdsPower from Vercel directly.

```bash
npm install
npm run companion
# keep this process running, then use Run this test locally on the web page
```

The companion listens only on `127.0.0.1:8787`, accepts requests only from the deployed page or localhost, and never accepts credentials. It runs existing AdsPower profiles through CDP, stops on challenges, and cleans up profiles in the runner's `finally` path.
## Usage

### Step 1: Generate Configuration

**Option A: Use the deployed web page** (recommended for config generation)

1. Visit the deployed Vercel page
2. Fill in your test parameters:
   - Site URL (e.g., `https://www.otto.de`)
   - Search keywords
   - Existing AdsPower profile IDs
   - Scroll settings, wait profiles, etc.
3. Click "Generate test configuration"
4. Download the JSON file

**Option B: Run locally with live testing** (avoids mixed content issues)

```bash
# Start both the configurator and companion
npm run dev

# Or start them separately in two terminals:
npm run serve      # Configurator at http://localhost:3000
npm run companion  # Companion API at http://127.0.0.1:8787
```

Then open http://localhost:3001 and click "Run this test locally" to execute tests directly through AdsPower.

**Why local HTTP?** Browsers block HTTPS pages (like Vercel) from connecting to local HTTP servers (mixed content security). Running the configurator locally on HTTP avoids this limitation.

### Step 2: Run Tests Locally
```bash
# Run with your configuration file
npm run runner sample-config.json

# Or specify a custom output report path
npm run runner my-config.json results/test-run-1.json

# Or run directly with node
node runner/otto-runner.cjs sample-config.json output-report.json
```

### Configuration Format

See `sample-config.json` for a complete example. Key fields:

```json
{
  "site_url": "https://www.otto.de",
  "profiles": ["k1fgmwtq", "k1f39ocj", "k1e3u6vd"],
  "search": {
    "keywords": "schuhe",
    "result_position": 4
  },
  "actions": {
    "add_to_cart": false,
    "remove_after_test": true,
    "accept_cookies": true,
    "scroll": { "enabled": true, "min": 2, "max": 4 }
  },
  "wait_profile": "human-varied",
  "limits": {
    "stop_on_captcha": true,
    "stop_on_checkout": true,
    "stop_on_payment": true
  }
}
```

## How It Works

### Runner Execution Flow

1. **Validation**: Validates configuration file format and required fields
2. **Profile Management**: 
   - Uses only existing profile IDs from the config
   - Starts each profile via AdsPower Local API
   - Connects to the browser via Chrome DevTools Protocol (CDP)
3. **Test Execution** (per profile):
   - Opens a new tab
   - Navigates to `site_url`
   - Accepts cookie consent dialogs
   - Searches for keywords using robust selectors including `input[placeholder*="Wonach suchst du"]`
   - Performs varied scrolling (random between min/max)
   - Selects the Nth product from search results
   - Visits the product page
   - Optionally adds to cart (QA only, if configured)
   - Optionally removes from cart afterward (cleanup)
   - Takes screenshots at each step (if enabled)
   - **Stops immediately if CAPTCHA/challenge detected**
   - **Never performs checkout, payment, or credential entry**
4. **Cleanup**: 
   - Closes tabs
   - Disconnects browser
   - Stops each profile (in `finally` block, always executes)
5. **Concurrency**: 
   - Runs up to 3 profiles concurrently (configurable in `MAX_CONCURRENT_WORKERS`)
   - Uses a bounded worker pool for efficient resource usage
6. **Reporting**: 
   - Captures detailed results for each profile
   - Writes comprehensive JSON report with timestamps, steps, errors, and screenshots

## Safety Features

The runner implements multiple safety guardrails:

- ✅ Uses existing profiles only (never creates or deletes)
- ✅ Stops on CAPTCHA/security challenges
- ✅ Never performs checkout or payment actions
- ✅ Never enters credentials or personal information
- ✅ Always stops profiles in `finally` block (guaranteed cleanup)
- ✅ Clear error handling with detailed logging
- ✅ URL validation to prevent invalid targets
- ✅ Optional cart add/remove for QA testing only

## Output

### Console Output
Real-time progress updates showing:
- Profile start/stop events
- Navigation and interaction steps
- CAPTCHA detection warnings
- Error messages and failures
- Final test summary

### JSON Report
Generated at the specified output path with:
```json
{
  "test_name": "Otto QA Run",
  "started_at": "2026-08-21T10:30:00.000Z",
  "completed_at": "2026-08-21T10:35:00.000Z",
  "duration_seconds": 300,
  "summary": {
    "total": 3,
    "completed": 2,
    "failed": 0,
    "stopped_captcha": 1
  },
  "results": [
    {
      "profile_id": "k1fgmwtq",
      "status": "completed",
      "product_url": "https://www.otto.de/p/example/",
      "steps": [...],
      "screenshots": [...]
    }
  ]
}
```

### Screenshots
If enabled, saved to `screenshots/` directory with naming format:
```
{profile_id}_{step}_{timestamp}.png
```

Examples:
- `k1fgmwtq_homepage_1724252400000.png`
- `k1fgmwtq_search_results_1724252405000.png`
- `k1fgmwtq_product_page_1724252410000.png`

## Troubleshooting

### "AdsPower API error"
- Ensure AdsPower is running on your Mac
- Check that profiles exist and are not already in use
- Verify `http://local.adspower.com:50325` is accessible

### "Could not find search input field"
- The site structure may have changed
- Check console output for attempted selectors
- Update selectors in `runner/otto-runner.cjs` if needed

### "CAPTCHA detected"
- This is expected behavior when stop_on_captcha is enabled
- The runner will stop the test and mark it as `stopped_captcha`
- Review the configuration or site access patterns

### Profile fails to start
- Check that the profile ID is correct
- Ensure the profile is not already running
- Try starting the profile manually in AdsPower first

## Development

### Project Structure
```
otto-qa-runner/
├── index.html              # Web configuration generator (deployable)
├── runner/
│   └── otto-runner.cjs     # Local test runner (local execution only)
├── package.json            # Dependencies and scripts
├── sample-config.json      # Example configuration
├── screenshots/            # Generated screenshots (created at runtime)
└── README.md              # This file
```

### Scripts
```bash
npm run validate    # Check runner syntax
npm run runner      # Run tests (requires config file argument)
npm test           # Alias for validate
```

### Extending the Runner
The runner uses modular functions that can be customized:
- `acceptCookies()`: Add more cookie dialog selectors
- `searchKeywords()`: Update search input selectors
- `selectNthProduct()`: Modify product link detection
- `addToCart()` / `removeFromCart()`: Update cart button selectors
- `detectCAPTCHA()`: Add more CAPTCHA detection patterns

## License

MIT

## Disclaimer

This tool is for QA testing purposes only. It:
- Does not bypass CAPTCHAs or security measures
- Does not manipulate traffic or obscure identities
- Does not perform actual purchases or payments
- Respects website terms of service
- Stops immediately when challenged

Users are responsible for ensuring their testing complies with all applicable terms of service and regulations.
