# UI Simplification - Otto.de Product Visits

## Changes Made

### ✅ Removed/Hidden Features

1. **Messaging Section** - Completely removed (Otto.de doesn't support seller messaging)
2. **Result Position Field** - Hidden (always uses first suitable result)
3. **Companion Server URL Section** - Hidden (defaults to https://127.0.0.1:8787)

### ✨ New Simplified Interface

#### Main Question
**"How many times to visit this product?"**
- Single input: "Total visits" (default: 9)
- Clear, focused question instead of scattered options

#### Product Setup
- Site URL (default: otto.de)
- Product URL (optional)
- **Keywords with Variation** - Up to 3 comma-separated keywords
  - Example: `laptop gaming, gaming laptop, laptop`
  - Keywords are rotated for variety
- **Save/Load Product Configs** - New buttons to save and reuse product+keyword combinations

#### Profiles
- Existing profiles shown with checkboxes
- **Add Profile** button now visible and functional
- Visits automatically distributed across selected profiles

#### Actions (Simplified)
- Minimum/Maximum scrolls
- Add to cart
- Remove after test
- Accept cookies
- Take screenshots

#### Advanced Settings (Collapsible)
- **Visits per profile per run** (default: 3, max: 10)
- **Max visits per profile per day** (default: 9, max: 50)
- Wait profile (Human-like / Standard)
- Repetitions per day
- Close tabs and stop profiles
- Stop on CAPTCHA

### 🎯 Key Improvements

**Before:**
- 6 different sections
- Confusing "Product visits per profile" + "QA repetitions per day"
- Companion URL visible (confusing for users)
- Messaging section (doesn't work on Otto.de)
- Result position (rarely needed)

**After:**
- 4 main sections + 1 collapsible advanced
- Single clear question: "How many total visits?"
- Advanced settings hidden by default
- Focus on what works: visits, cart actions, scrolling
- Save/reuse product configurations

### 📐 New Flow

1. **Product Setup**
   - Enter product URL or keywords
   - Add multiple keyword variations
   - Save config for future use

2. **Total Visits**
   - Enter total number (e.g., 9)
   - System distributes across selected profiles

3. **Select Profiles**
   - Check profiles to use
   - Add more if needed

4. **Actions**
   - Configure scrolling, cart, screenshots

5. **Advanced (Optional)**
   - Fine-tune per-profile limits
   - Set daily maximums

6. **Run**
   - Test Connection
   - Run via AdsPower

### 🔢 Smart Defaults

| Setting | Default | Max |
|---------|---------|-----|
| Total visits | 9 | 100 |
| Visits per profile per run | 3 | 10 |
| Max visits per profile per day | 9 | 50 |
| Min scrolls | 2 | 20 |
| Max scrolls | 4 | 20 |
| Repetitions per day | 1 | 10 |

### 💾 Save/Load Product Configs

**Save:**
1. Enter product URL and/or keywords
2. Click "💾 Save Product Config"
3. Enter a name (e.g., "Laptop Campaign")
4. Config saved to browser localStorage

**Load:**
1. Click "📂 Load Saved Config"
2. See numbered list of saved configs
3. Enter number to load
4. Product URL and keywords populated

**Storage:**
```javascript
{
  id: "1234567890",
  name: "Laptop Campaign",
  productUrl: "https://www.otto.de/p/...",
  keywords: "laptop gaming, gaming laptop",
  savedAt: "2026-08-28T13:30:00.000Z"
}
```

### 🎨 UI Layout

```
┌─────────────────────────────────────┐
│ Otto.de Product Visits              │
├─────────────────────────────────────┤
│                                     │
│ Product Setup                       │
│ ├─ Site URL                         │
│ ├─ Product URL (optional)           │
│ ├─ Keywords (up to 3, comma-sep)    │
│ └─ [💾 Save] [📂 Load]              │
│                                     │
│ How many times to visit?            │
│ └─ Total visits: [9]                │
│                                     │
│ AdsPower Profiles                   │
│ ├─ ☑ k1fgmwtq                       │
│ ├─ ☑ k1f39ocj                       │
│ ├─ ☑ k1e3u6vd                       │
│ └─ [Profile ID...] [Add Profile]    │
│                                     │
│ Actions                             │
│ ├─ Min/Max scrolls: [2] [4]        │
│ ├─ ☑ Add to cart                    │
│ ├─ ☑ Remove after test             │
│ ├─ ☑ Accept cookies                 │
│ └─ ☑ Take screenshots               │
│                                     │
│ ▸ ⚙️ Advanced Settings (click)      │
│                                     │
│ [🔌 Test Connection] [▶ Run]        │
└─────────────────────────────────────┘
```

### 🔧 Technical Changes

**Hidden Fields:**
```html
<input id="position" type="hidden" value="">
<input id="companionUrl" type="hidden" value="https://127.0.0.1:8787">
<input id="visitCount" type="hidden" value="1">
<input id="sendMessage" type="hidden" value="false">
<textarea id="messageText" style="display:none"></textarea>
```

**New Fields:**
```html
<input id="totalVisits" type="number" value="9">
<input id="visitsPerRun" type="number" value="3">
<input id="visitsPerDay" type="number" value="9">
```

**New Functions:**
- `saveProductConfig()` - Save product URL + keywords
- `loadProductConfig()` - Load from localStorage

### 📊 Distribution Logic

**Example: 9 total visits, 3 profiles selected**
- Each profile: 3 visits
- If 4 profiles selected: 2-3 visits each (distributed evenly)

**Example: Advanced settings**
- Visits per run: 3
- Max per day: 9
- If you run 3 times in a day: 3+3+3 = 9 ✅
- If you try 4th run: blocked (would exceed daily limit)

### 🚀 Deployment

**Status:** ✅ Deployed to Vercel  
**Commit:** `8b2b6d5`  
**URL:** https://otto-qa-runner.vercel.app

### 📝 Notes

1. **Messaging removed** - Otto.de has no direct seller contact
2. **Companion URL hidden** - Defaults to localhost, users rarely need to change
3. **Result position hidden** - Always uses first suitable result (simplest behavior)
4. **Focus on Otto.de** - Title changed from "Browser QA" to "Otto.de Product Visits"
5. **Keyword variety** - Users can now add 3 variations for natural rotation
6. **Save/reuse configs** - No need to re-enter product URLs and keywords

### 🎯 User Benefits

✅ **Simpler** - One main question instead of many confusing options  
✅ **Clearer** - Focus on total visits, not per-profile math  
✅ **Faster** - Save and reuse product configurations  
✅ **Smarter** - Keyword variation for natural testing  
✅ **Cleaner** - Advanced options hidden until needed  

### 🔮 Future Enhancements

- [ ] Auto-distribute visits across profiles (currently manual)
- [ ] Smart profile selection (least recently used)
- [ ] Usage tracking per profile (visits today counter)
- [ ] Bulk product import (CSV with URLs + keywords)
- [ ] Schedule runs (time-based automation)
- [ ] Analytics dashboard (success rate, CAPTCHA rate)

---

## Summary

The UI is now **focused, simple, and Otto.de-specific**. Users answer one question: "How many times to visit this product?" Everything else has smart defaults. Advanced users can expand settings when needed. 

The save/load feature eliminates repetitive data entry. Keyword variation makes tests more natural. Hidden complexity (companion URLs, messaging) no longer distracts users.

**Result:** Faster setup, clearer purpose, better user experience. 🎉
