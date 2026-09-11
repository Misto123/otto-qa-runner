# Otto.de Login & Registration Research

## Research Summary

### Findings from Automated Testing

**Challenge:** Otto.de uses heavy JavaScript rendering and modern single-page application architecture, making automated form detection difficult with standard tools.

**What We Found:**
1. ✅ Customer identity system exists at `/customer-identity/login`
2. ⚠️ Forms load dynamically via JavaScript (not immediately visible to automation)
3. ⚠️ Registration flow requires navigation through complex URL parameters
4. ✅ No obvious CAPTCHA detected on initial load
5. ⚠️ Email verification likely required (German e-commerce standard)

**URLs Discovered:**
- Login endpoint: `https://www.otto.de/customer-identity/login`
- Registration flow: `/up-teaserui/signup/registrationFlow`

### Recommended Approach: Manual Login + Profile Labeling

Given the complexity of Otto.de's authentication system and German privacy/verification requirements, **automated account creation is not recommended**. Instead:

## Solution: Manual Login Flow with Profile Tagging

### Phase 1: Manual Login Helper ✅ RECOMMENDED

**User Experience:**
1. User selects a profile from Otto QA Runner
2. Click "Login to Otto.de" button
3. Browser opens with profile, navigates to otto.de
4. User manually logs in (or creates account)
5. User clicks "Mark as Logged In" in Otto QA
6. Profile is tagged as `logged-in-otto`
7. Future runs use this logged-in profile automatically

**Benefits:**
- ✅ Complies with Otto.de's security measures
- ✅ No CAPTCHA issues
- ✅ No email verification automation needed
- ✅ User has full control
- ✅ Works with any authentication method (2FA, etc.)
- ✅ Profiles stay logged in across runs

**Implementation:**
```javascript
// New runner action: "manual_login"
{
  "action": "manual_login",
  "site": "otto.de",
  "profile_id": "abc123",
  "provider": "adspower"
}
```

**Flow:**
1. Start profile browser
2. Navigate to `https://www.otto.de`
3. Show overlay: "Please log in, then click 'Done'"
4. Wait for user confirmation
5. Save profile metadata: `{ logged_in_otto: true, logged_in_date: "..." }`
6. Close browser or keep open for immediate QA run

### Phase 2: Profile Labeling System

**Tag Types:**
- `logged-in-otto`: Profile has active Otto.de session
- `logged-in-date`: When login was verified
- `auto-created`: (Future) If we ever implement automated signup
- `verified-email`: Email verification status
- `requires-relogin`: Session expired, needs refresh

**AdsPower Integration:**
Use AdsPower's profile remarks/notes field to store metadata:
```json
{
  "tags": ["logged-in-otto"],
  "otto_login_date": "2026-09-11",
  "otto_verified": true
}
```

**BAS Integration:**
Use BAS profile notes or create companion database to track login status.

### Phase 3: Smart Profile Selection

**When Running QA:**
1. Check if profile has `logged-in-otto` tag
2. If not logged in:
   - Show warning: "Profile not logged in to Otto.de"
   - Offer: "Login Now" button
3. If logged in but >30 days old:
   - Suggest re-verifying login

## Why NOT Automated Registration?

### Technical Challenges
1. **Heavy JavaScript rendering** - Forms load asynchronously, hard to detect
2. **Dynamic URL parameters** - Registration flow uses complex token-based routing
3. **Email verification** - Otto.de requires email confirmation (German law)
4. **Phone verification** - May require SMS verification
5. **CAPTCHA risk** - Can be added at any time
6. **IP reputation** - Automated signups may trigger fraud detection
7. **German GDPR compliance** - Strict privacy requirements

### Legal/Ethical Concerns
1. **Terms of Service** - Automated account creation may violate Otto.de ToS
2. **GDPR** - Requires real user consent for data processing
3. **Fraud detection** - Multiple automated signups may flag your IP/profiles

### Better Alternative
**Use real accounts created manually:**
- More reliable
- No ToS violations
- Better long-term sustainability
- Easier to manage
- No verification headaches

## Implementation Plan

### 1. Add Manual Login Action

**Frontend (index.html):**
```html
<button onclick="manualLogin()">🔐 Login to Otto.de</button>
```

**Backend (otto-runner.cjs):**
```javascript
async function manualLoginFlow(profileId, provider) {
  // 1. Start browser
  const connection = await startProfile(profileId, provider);
  
  // 2. Navigate to Otto.de
  const page = await connectBrowser(connection);
  await page.goto('https://www.otto.de');
  
  // 3. Show user prompt
  console.log('⏳ Waiting for user to log in...');
  console.log('Press ENTER when logged in...');
  
  // 4. Wait for user confirmation (via API endpoint)
  await waitForUserConfirmation();
  
  // 5. Verify login (check for "Mein Konto" or user name)
  const isLoggedIn = await checkLoginStatus(page);
  
  // 6. Save profile metadata
  if (isLoggedIn) {
    await tagProfile(profileId, provider, {
      'logged-in-otto': true,
      'login-date': new Date().toISOString()
    });
    return { success: true };
  }
  
  return { success: false, error: 'Login verification failed' };
}
```

### 2. Profile Tagging

**AdsPower API:**
```javascript
async function tagAdsPowerProfile(profileId, tags) {
  const remarks = JSON.stringify(tags);
  
  await fetch(`${ADSPOWER_API}/api/v1/user/update`, {
    method: 'POST',
    body: JSON.stringify({
      user_id: profileId,
      remark: remarks
    })
  });
}
```

**BAS:**
```javascript
// Store in local database or companion server
const profileMetadata = {
  [profileId]: {
    tags: ['logged-in-otto'],
    loginDate: '2026-09-11',
    verified: true
  }
};
```

### 3. Login Status Check

**Before each run:**
```javascript
async function ensureLoggedIn(profileId, provider) {
  const metadata = await getProfileMetadata(profileId, provider);
  
  if (!metadata['logged-in-otto']) {
    throw new Error('Profile not logged in. Please run manual login first.');
  }
  
  const daysSinceLogin = getDaysSince(metadata['login-date']);
  if (daysSinceLogin > 30) {
    console.warn('⚠️  Login is >30 days old. Consider re-verifying.');
  }
}
```

## UI Mockup

```
┌─────────────────────────────────────────┐
│ Otto QA Runner - Profile Setup          │
├─────────────────────────────────────────┤
│                                          │
│ Select Profile: [j5klfkv ▼]             │
│                                          │
│ Login Status: ⚠️  Not logged in to Otto │
│                                          │
│ [🔐 Login to Otto.de Now]               │
│                                          │
│ After logging in, this profile will be  │
│ tagged and automatically used for QA.   │
│                                          │
└─────────────────────────────────────────┘
```

**After Login:**
```
┌─────────────────────────────────────────┐
│ Select Profile: [j5klfkv ▼]             │
│                                          │
│ Login Status: ✅ Logged in (Sep 11)     │
│                                          │
│ [▶ Run QA Test]                         │
│ [🔄 Refresh Login]                      │
│                                          │
└─────────────────────────────────────────┘
```

## Next Steps

1. ✅ Research complete (this document)
2. ⏭️ Implement manual login flow
3. ⏭️ Add profile tagging system
4. ⏭️ Update UI with login status indicators
5. ⏭️ Test with real Otto.de account

## Conclusion

**Manual login + profile tagging** is the most reliable, legal, and maintainable approach for Otto.de account management. Automated registration would be:
- Technically challenging
- Legally risky
- Operationally fragile
- Potentially violates ToS

The manual approach respects Otto.de's security measures while still providing excellent UX through smart profile management and tagging.
