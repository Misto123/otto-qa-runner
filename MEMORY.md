# Otto QA Runner - Key Information

## Deployment
- **URL:** https://otto-qa-runner.vercel.app
- **Password:** `rereeu`
- **Status:** Production ready (AdsPower working perfectly)

## API Keys
- **Remote Browser API:** http://65.21.199.228:3000
- **API Key:** `JTYDA_7531D_98HGTR_YT154` (stored in 1Password "Rebel Cloud Browser api")

## Providers
### AdsPower ✅ Production Ready
- **Status:** Fully working
- **Duration:** 20 seconds per profile
- **Tested:** 1, 3, 15 profiles
- **Deployment:** Vercel-only viable (under 300s limit)

### BAS ⚠️ Partially Working
- **Status:** Code complete, server-side issue
- **Proxies:** 2 Rebel mobile proxies (URL-encoded)
  - `http://ottovisits%3Bp%3D1:LfjlMN)S*Cy74*_r@proxy2.rebelinternet.eu:5001`
  - `http://ottovisits%3Bp%3D2:LfjlMN)S*Cy74*_r@proxy2.rebelinternet.eu:5001`
- **Issue:** Works once, then fails (Remote Browser API cleanup issue)
- **Fix needed:** Server-side debugging

## Repository
- **GitHub:** https://github.com/Misto123/otto-qa-runner
- **Latest commit:** "Document BAS breakthrough (URL encoding) and current server-side limitation"

## Cost
- **Total:** $0/month (Vercel Hobby plan)
