# BAS Remote Browser - Working vs Our Code Analysis

## ✅ **YOUR WORKING CURL**

```bash
curl -X POST "http://65.21.199.228:3000/browsers/start?x_api_key=XXXXXX" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "bas",
    "profileId": "12345",
    "proxy": "admin:cool@185.14.187.8:8070"
  }'
```

**Response:**
```json
{
  "success": false,
  "error": "Profile is not a cloud profile"
}
```

✅ **This proves BAS is working!** Just needs correct profile type.

---

## ❌ **OUR CODE - KEY DIFFERENCES**

### Difference #1: API Key Location

**Your curl:** Query parameter
```bash
?x_api_key=XXXXXX
```

**Our code:** Header
```javascript
headers: {
  'x_api_key': REMOTE_BROWSER_API_KEY
}
```

### Difference #2: Proxy Format

**Your curl:** Simple `username:password@host:port`
```json
"proxy": "admin:cool@185.14.187.8:8070"
```

**Our code:** Full URL with URL-encoding
```json
"proxy": "http://ottovisits%3Bp%3D1:LfjlMN)S*Cy74*_r@proxy2.rebelinternet.eu:5001"
```

### Difference #3: ProfileId Type

**Your curl:** STRING
```json
"profileId": "12345"
```

**Our code:** NUMBER
```json
"profileId": 7751
```

---

## 🔍 **Root Cause Analysis**

### Why Your Curl Works and Our Code Gets 404

The Remote Browser API likely:

1. **Accepts API key in query OR header** ✅ Both work
2. **Expects simple proxy format** ❌ Our URL encoding might break it
3. **Expects string profileId** ❌ We send number

**Most likely culprit:** The proxy format with `http://` prefix and URL-encoded special chars.

---

## 🛠️ **How to Fix**

### Option 1: Change Proxy Format (Recommended)

**Current BAS proxy:**
```javascript
proxy: 'http://ottovisits%3Bp%3D1:LfjlMN)S*Cy74*_r@proxy2.rebelinternet.eu:5001'
```

**Should be:**
```javascript
proxy: 'ottovisits;p=1:LfjlMN)S*Cy74*_r@proxy2.rebelinternet.eu:5001'
```

Remove:
- ❌ `http://` prefix
- ❌ URL encoding (`%3B` and `%3D`)

The API likely handles the protocol internally.

### Option 2: Use Query Parameter for API Key

Change from header to query parameter to match your curl exactly.

---

## 📋 **Fixes Needed**

### File: `runner/bas-proxies.cjs`

**Change:**
```javascript
// BEFORE (lines 14, 19)
proxy: 'http://ottovisits%3Bp%3D1:LfjlMN)S*Cy74*_r@proxy2.rebelinternet.eu:5001'
proxy: 'http://ottovisits%3Bp%3D2:LfjlMN)S*Cy74*_r@proxy2.rebelinternet.eu:5001'

// AFTER
proxy: 'ottovisits;p=1:LfjlMN)S*Cy74*_r@proxy2.rebelinternet.eu:5001'
proxy: 'ottovisits;p=2:LfjlMN)S*Cy74*_r@proxy2.rebelinternet.eu:5001'
```

### File: `runner/remote-browser-client.cjs`

**Change profileId to string (line 56):**
```javascript
// BEFORE
body.profileId = typeof profileId === 'string' ? parseInt(profileId, 10) : profileId;

// AFTER
body.profileId = String(profileId);
```

---

## 🧪 **Test After Fix**

Expected result:
```json
{
  "success": false,
  "error": "Profile is not a cloud profile"
}
```

This means BAS is receiving the request correctly!

Then we need to:
1. Use a cloud-enabled profile ID
2. Or configure profiles as "cloud" type in BAS

---

## ✅ **Summary**

**Your curl revealed:**
- ✅ BAS endpoint works
- ✅ BAS service is running
- ✅ Authentication works
- ❌ Our proxy format is wrong (too much URL encoding)
- ❌ Our profileId type is wrong (number vs string)

**After fixing these 2 issues, BAS should work!**

---

## 📝 **Working Configuration**

**Correct format for BAS:**
```json
{
  "provider": "bas",
  "profileId": "12345",                    // STRING, not number
  "proxy": "user:pass@host:port",          // Simple format, no http:// or URL encoding
  "timeout": 1800000
}
```

**NOT:**
```json
{
  "provider": "bas",
  "profileId": 12345,                                           // ❌ Number
  "proxy": "http://user%3Bparam:pass@host:port",               // ❌ With http:// and encoding
  "timeout": 1800000
}
```
