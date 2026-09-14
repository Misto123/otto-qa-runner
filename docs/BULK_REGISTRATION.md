# 🎯 Otto.de Bulk Registration System

## Overview

Automated bulk account registration for Otto.de with fake data generation and profile management.

---

## 🌐 Access

**Registration Page:** https://otto-qa-runner.vercel.app/register.html

**No password required** - direct access

---

## ✨ Features

### 1. **Bulk Data Generation**
- German names database (male/female first names, last names)
- Realistic German addresses (streets, cities, ZIP codes)
- Random phone numbers (+49 format)
- Secure password generation (12 chars, mixed)
- Support for DE, AT, CH countries

### 2. **Flexible Input**
- **Generate Mode:** Auto-generate 1-100 accounts with random data
- **CSV Import:** Paste your own account data
- **CSV Template:** Download template for bulk import

### 3. **Automated Registration**
- Creates new AdsPower profile per account
- Navigates to Otto.de
- Accepts cookies automatically
- Fills registration form
- Submits and verifies registration
- Tags profile as logged-in

### 4. **Real-time Monitoring**
- Live progress tracking
- Success/failure counters
- Detailed log of each registration
- Screenshot capture for debugging

### 5. **Export Results**
- Download CSV with all account details
- Includes profile IDs, passwords, status
- Export for backup/documentation

---

## 📋 How to Use

### Method 1: Generate Random Data

1. **Open:** https://otto-qa-runner.vercel.app/register.html

2. **Configure:**
   - Select "Generate Random Data"
   - Set number of accounts (1-100)
   - Enter email domain (e.g., `example.com`)
   - Select country (DE/AT/CH)

3. **Generate:**
   - Click "🎲 Generate Data"
   - Review generated accounts in preview

4. **Register:**
   - Click "🚀 Start Registration"
   - Watch real-time progress
   - Wait for completion

5. **Export:**
   - Click "💾 Download Results"
   - Save CSV with credentials

### Method 2: Import CSV Data

1. **Prepare CSV:**
   - Format: `email, firstName, lastName, address, zipCode, city, phone`
   - One account per line
   - Example:
     ```
     test@example.com,Max,Mustermann,Musterstraße 1,10115,Berlin,+4915112345678
     anna@example.com,Anna,Schmidt,Hauptstraße 42,20095,Hamburg,+4915198765432
     ```

2. **Import:**
   - Select "Paste CSV Data"
   - Paste your CSV in the textarea
   - Click "🎲 Generate Data"

3. **Register:**
   - Same as Method 1

---

## 🔧 Technical Details

### Generated Data Format

```json
{
  "email": "max.mueller1234@example.com",
  "firstName": "Max",
  "lastName": "Müller",
  "address": "Hauptstraße 42",
  "zipCode": "10115",
  "city": "Berlin",
  "phone": "+491511234567",
  "password": "Abc123!@#Xyz",
  "country": "DE"
}
```

### Registration Flow

1. **Create AdsPower Profile**
   - Name: `Otto - {firstName} {lastName}`
   - Remark: `Auto-registered: {email}`
   - Unique fingerprint per profile

2. **Open Browser**
   - Navigate to `https://www.otto.de`
   - Accept cookies
   - Find account/login menu

3. **Fill Registration Form**
   - Locate registration link
   - Fill email, password, name
   - Fill address (if required)
   - Submit form

4. **Verify Success**
   - Check for confirmation message
   - Check URL for success indicators
   - Tag profile as logged-in
   - Capture screenshots

5. **Report Result**
   - Success: Return profile ID
   - Failure: Return error message

### API Endpoint

**POST /register/otto**

Request:
```json
{
  "email": "test@example.com",
  "firstName": "Max",
  "lastName": "Mustermann",
  "password": "SecurePass123!",
  "address": "Hauptstraße 1",
  "zipCode": "10115",
  "city": "Berlin",
  "phone": "+4915112345678",
  "country": "DE",
  "provider": "adspower"
}
```

Response (Success):
```json
{
  "ok": true,
  "success": true,
  "profileId": "k1abcd123",
  "email": "test@example.com",
  "message": "Registration completed"
}
```

Response (Failure):
```json
{
  "ok": false,
  "success": false,
  "error": "Email already registered",
  "email": "test@example.com"
}
```

---

## 📊 Generated Account Example

```
Email:      max.mueller7821@example.com
Name:       Max Müller
Address:    Lindenstraße 127
ZIP/City:   20095 Hamburg
Phone:      +491589234567
Password:   X8pK2!mN9qR$
Country:    DE
Profile ID: k1xyz789
```

---

## 🎨 UI Features

### Data Preview
- Shows all generated accounts before registration
- Display: name, email, address, phone, password
- Scrollable list with clean cards

### Progress Stats
- **Total:** Number of accounts to register
- **Success:** Successfully registered
- **Failed:** Registration failures
- **Progress:** Percentage complete

### Status Log
- Real-time registration status
- Color-coded messages:
  - 🟢 Green: Success
  - 🔴 Red: Errors
  - ⚪ White: Info
- Auto-scrolls to latest

---

## ⚙️ Configuration

### Email Domains
Choose any domain for generated emails:
- `example.com` (default)
- `test.de`
- `temp-mail.org`
- Your own domain

### Countries Supported
- **DE (Germany):** Berlin, Hamburg, München, Köln, Frankfurt
- **AT (Austria):** Coming soon
- **CH (Switzerland):** Coming soon

### Rate Limiting
- 2 seconds delay between registrations
- Prevents Otto.de rate limiting
- Can be adjusted in code

---

## 🐛 Troubleshooting

### "Registration status unclear"
- Otto.de form structure changed
- Manual verification needed
- Check screenshot in `/tmp/otto-register-{profileId}-result.png`

### "Could not find email input field"
- Otto.de changed form selectors
- Update selectors in `otto-registration.cjs`
- Check screenshot in `/tmp/otto-register-{profileId}-form.png`

### "Failed to create profile"
- AdsPower API issue
- Check companion server logs
- Verify API credentials

### CAPTCHA Required
- Otto.de detected automation
- Switch to manual login flow
- Use proxy/residential IPs

---

## 📁 File Structure

```
otto-qa-runner/
├── register.html              # Frontend UI
├── runner/
│   └── otto-registration.cjs  # Backend automation
└── companion/
    └── server.cjs             # API endpoint (updated)
```

---

## 🔒 Security Notes

1. **Passwords Generated:**
   - 12 characters minimum
   - Mixed case, numbers, symbols
   - Cryptographically secure randomness

2. **Data Storage:**
   - Account data only in memory during registration
   - Export to CSV for user's own storage
   - No passwords sent to server logs

3. **Profile Isolation:**
   - Each account in separate AdsPower profile
   - Unique fingerprints prevent correlation
   - No shared cookies/storage

---

## 🚀 Future Enhancements

- [ ] Email verification automation
- [ ] Phone verification (SMS API integration)
- [ ] Proxy rotation per profile
- [ ] CAPTCHA solving integration
- [ ] Address validation against German postal data
- [ ] Batch profile export/import
- [ ] Scheduled re-registration for expired accounts

---

## 📝 CSV Template

Download template from UI or use this format:

```csv
email,firstName,lastName,address,zipCode,city,phone
max@test.de,Max,Mustermann,Hauptstraße 1,10115,Berlin,+4915112345678
anna@test.de,Anna,Schmidt,Bergstraße 42,20095,Hamburg,+4915198765432
```

---

## ✅ Success Criteria

Registration is considered successful if:
1. Form submits without errors
2. Page shows "Willkommen" or "erfolgreich" message
3. URL contains "success" or "confirmation"
4. No error alerts visible on page

Profile is automatically tagged as logged-in on success.

---

## 🎉 Ready to Use!

**Start registering accounts:**
https://otto-qa-runner.vercel.app/register.html

**Companion server must be running:**
```bash
cd /Users/northsea/ClaudeProjects/otto-qa-runner
export REMOTE_BROWSER_API_URL="http://65.21.199.228:3000"
export REMOTE_BROWSER_API_KEY="JTYDA_7531D_98HGTR_YT154"
HTTPS=true node companion/server.cjs
```
