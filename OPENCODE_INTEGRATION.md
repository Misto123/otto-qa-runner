# OpenCode + AdsPower Integration

This guide shows how to integrate Otto QA Runner with OpenCode for AI-powered browser automation.

## Overview

OpenCode can control AdsPower browsers directly using:
1. **AdsPower Local API MCP Server** - Connect OpenCode to your AdsPower instance
2. **AdsPower Browser Skill** - High-level browser automation commands

## Setup

### 1. Install AdsPower MCP Server

Add to your `opencode.json` (or `~/.config/opencode/opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "adspower-local-api": {
      "command": "npx",
      "args": [
        "-y",
        "local-api-mcp-typescript"
      ],
      "env": {
        "PORT": "50326",
        "API_KEY": "746feb8ab409fbb27a0377a864279e6c000f879a7a0e5329"
      }
    }
  }
}
```

**Get your API key:**
```bash
# AdsPower → Settings → API → Generate Key
# Or find it in AdsPower application settings
```

### 2. Install AdsPower Browser Skill

```bash
npx skills add https://github.com/adspower/adspower-browser --skill adspower-browser
```

This skill provides high-level commands for:
- Opening and managing browser profiles
- Navigation and interaction
- Taking screenshots
- Running automated tests

## Usage with Otto QA Runner

### Scenario 1: Run Tests via OpenCode

```javascript
// In OpenCode chat:
"Start the Otto QA companion server and run a test on profile k1fgmwtq"

// OpenCode will:
// 1. Start companion: npm run companion
// 2. Use AdsPower MCP to verify profile exists
// 3. Submit test config to companion
// 4. Monitor results and report back
```

### Scenario 2: Direct AdsPower Control

```javascript
// Open a profile and navigate
"Open AdsPower profile k1fgmwtq and visit otto.de"

// Run custom automation
"Search for 'sneakers' on the current page and click the 3rd result"

// Take diagnostic screenshots
"Take a screenshot of the current page"
```

### Scenario 3: Combined Workflow

```javascript
// 1. Use Otto QA Runner for standard tests
"Run the standard Otto QA test on profiles k1fgmwtq, k1f39ocj, k1e3u6vd"

// 2. If issues found, debug with AdsPower skill
"Open profile k1fgmwtq and navigate to the failing product page"
"Take a screenshot and check for CAPTCHA"

// 3. Fix and re-run
"Update the config to disable CAPTCHA stopping and re-run"
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        OpenCode AI                           │
│  (orchestrates AdsPower + Otto QA Runner)                   │
└───────────────────┬─────────────────────┬───────────────────┘
                    │                     │
         ┌──────────▼──────────┐  ┌──────▼──────────┐
         │  AdsPower MCP       │  │ Otto QA Runner  │
         │  (local-api-mcp)    │  │ (companion)     │
         └──────────┬──────────┘  └──────┬──────────┘
                    │                     │
         ┌──────────▼─────────────────────▼──────────┐
         │        AdsPower Local API                  │
         │        (http://local.adspower.com:50325)  │
         └──────────┬─────────────────────────────────┘
                    │
         ┌──────────▼──────────┐
         │  Browser Profiles   │
         │  (k1fgmwtq, etc.)   │
         └─────────────────────┘
```

## Benefits

### 1. **AI-Powered Test Generation**
OpenCode can analyze your site and generate test configs:
```
"Create a QA test for otto.de that searches for gaming laptops, 
 scrolls through results, and visits the top 3 products"
```

### 2. **Intelligent Error Handling**
OpenCode can diagnose and fix issues:
```
"The test failed with CAPTCHA on profile k1fgmwtq. 
 Investigate and suggest a fix."
```

### 3. **Natural Language Control**
No need to write code or JSON configs:
```
"Run a quick test on one profile to verify the site is working"
```

### 4. **Automated Reporting**
OpenCode can analyze test results and generate summaries:
```
"Run tests on all profiles and summarize the results"
```

## Example Workflows

### Morning QA Check
```
"Good morning! Run standard QA tests on all profiles and report any issues"
```

OpenCode will:
1. Start companion server
2. Run tests on all configured profiles
3. Analyze results
4. Report failures with details
5. Suggest fixes if needed

### Debugging Failed Profile
```
"Profile k1f39ocj failed with proxy error. 
 Check the profile configuration and fix it."
```

OpenCode will:
1. Use AdsPower MCP to inspect profile
2. Verify proxy settings
3. Suggest corrections
4. Re-run test to verify fix

### Bulk Profile Testing
```
"Test these 10 profiles: [list]. 
 Run 3 concurrent workers and save reports."
```

OpenCode will:
1. Configure concurrent execution
2. Monitor progress
3. Handle errors gracefully
4. Generate consolidated report

## Configuration Tips

### Port Configuration
- **AdsPower API**: Default `50325`
- **Otto Companion**: Default `8787`
- **MCP Server**: Configure in `env.PORT` (e.g., `50326`)

### API Key Security
- Store API key in `opencode.json` (gitignored)
- Never commit API keys to repository
- Rotate keys regularly in AdsPower settings

### Network Access
The companion server (otto-qa-runner) accepts connections from:
- Local machine: `http://127.0.0.1:8787`
- Local network: `http://192.168.x.x:8787` (auto-detected)
- Remote devices: Use Vercel app with local IP

## Troubleshooting

### "Cannot connect to AdsPower API"
```bash
# Verify AdsPower is running
curl http://local.adspower.com:50325/api/v1/browser/active

# Check API key in opencode.json
# Restart OpenCode after config changes
```

### "Companion server not responding"
```bash
# Start manually
npm run companion

# Check if port 8787 is in use
lsof -i :8787

# Try different port
PORT=8788 npm run companion
```

### "Profile not found"
```bash
# List available profiles via MCP
# OpenCode: "List all AdsPower profiles"

# Or directly via API
curl http://local.adspower.com:50325/api/v1/user/list
```

## Advanced Usage

### Custom Test Scenarios
OpenCode can generate custom configs on-the-fly:

```
"Create a test that:
- Opens 5 random profiles
- Searches for electronics
- Adds 2 items to cart from top 10 results
- Takes screenshots at each step
- Removes items after testing"
```

### Scheduled Testing
```
"Set up a cron job to run QA tests every 6 hours"
```

OpenCode will:
1. Generate cron configuration
2. Create test script
3. Set up logging
4. Configure notifications

### Integration with CI/CD
```
"Add this QA runner to GitHub Actions for PRs"
```

OpenCode will:
1. Create workflow file
2. Configure AdsPower in CI
3. Add test reports to PR comments
4. Set up failure notifications

## Resources

- [AdsPower API Docs](https://adspower.com/api)
- [OpenCode MCP Guide](https://opencode.ai/docs/mcp)
- [Otto QA Runner Docs](./README.md)
- [AdsPower Browser Skill](https://github.com/adspower/adspower-browser)

## Support

For issues or questions:
1. Check the [Otto QA Runner README](./README.md)
2. Visit [AdsPower Community](https://community.adspower.com)
3. Open an issue on GitHub
