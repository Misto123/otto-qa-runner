/**
 * Playwright Script for Otto.de Account Data Parsing
 * 
 * This script helps parse account data from various sources:
 * - CSV files
 * - JSON files
 * - Web pages with account lists
 * - Excel/spreadsheet data
 * 
 * Usage:
 *   node scripts/parse-accounts.cjs <input-file>
 *   node scripts/parse-accounts.cjs --url <web-url>
 *   node scripts/parse-accounts.cjs --interactive
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse CSV file
 */
function parseCSV(filePath) {
  console.log(`\n📄 Parsing CSV: ${filePath}`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n');
  
  // Detect if first line is header
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('email') || firstLine.includes('firstname');
  
  const dataLines = hasHeader ? lines.slice(1) : lines;
  
  const accounts = dataLines.map((line, index) => {
    const parts = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    
    // Try to detect format
    if (parts.length >= 8) {
      // Full format: email, gender, firstName, lastName, address, zipCode, city, phone
      return {
        email: parts[0],
        gender: parts[1] || 'Herr',
        firstName: parts[2],
        lastName: parts[3],
        address: parts[4],
        zipCode: parts[5],
        city: parts[6],
        phone: parts[7],
        password: parts[8] || generatePassword(),
        country: parts[9] || 'DE'
      };
    } else if (parts.length >= 4) {
      // Minimal format: email, firstName, lastName, phone
      return {
        email: parts[0],
        gender: 'Herr',
        firstName: parts[1],
        lastName: parts[2],
        address: '',
        zipCode: '',
        city: '',
        phone: parts[3] || '',
        password: generatePassword(),
        country: 'DE'
      };
    } else {
      console.warn(`⚠️  Line ${index + 1}: Invalid format (${parts.length} fields)`);
      return null;
    }
  }).filter(Boolean);
  
  console.log(`✅ Parsed ${accounts.length} accounts`);
  return accounts;
}

/**
 * Parse JSON file
 */
function parseJSON(filePath) {
  console.log(`\n📄 Parsing JSON: ${filePath}`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  
  // Handle different JSON structures
  let accounts = [];
  
  if (Array.isArray(data)) {
    accounts = data;
  } else if (data.accounts && Array.isArray(data.accounts)) {
    accounts = data.accounts;
  } else if (data.data && Array.isArray(data.data)) {
    accounts = data.data;
  } else {
    throw new Error('Unknown JSON structure');
  }
  
  // Normalize account objects
  accounts = accounts.map(acc => ({
    email: acc.email || acc.mail || acc.username,
    gender: acc.gender || acc.title || 'Herr',
    firstName: acc.firstName || acc.firstname || acc.first_name || '',
    lastName: acc.lastName || acc.lastname || acc.last_name || '',
    address: acc.address || acc.street || '',
    zipCode: acc.zipCode || acc.zip || acc.postal_code || '',
    city: acc.city || '',
    phone: acc.phone || acc.tel || acc.telephone || '',
    password: acc.password || acc.pass || generatePassword(),
    country: acc.country || 'DE',
    profileId: acc.profileId || acc.profile_id || null,
    status: acc.status || 'pending'
  }));
  
  console.log(`✅ Parsed ${accounts.length} accounts`);
  return accounts;
}

/**
 * Parse from clipboard (interactive mode)
 */
async function parseClipboard() {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  console.log('\n📋 Reading from clipboard...');
  
  try {
    // Try to read clipboard on macOS
    const { stdout } = await execAsync('pbpaste');
    const content = stdout.trim();
    
    if (!content) {
      throw new Error('Clipboard is empty');
    }
    
    // Try to detect format
    if (content.startsWith('[') || content.startsWith('{')) {
      // JSON
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : [data];
    } else {
      // CSV
      const lines = content.split('\n').filter(line => line.trim());
      
      const accounts = lines.map(line => {
        const parts = line.split(/[,\t]/).map(s => s.trim());
        
        return {
          email: parts[0],
          gender: parts[1] || 'Herr',
          firstName: parts[2],
          lastName: parts[3],
          address: parts[4] || '',
          zipCode: parts[5] || '',
          city: parts[6] || '',
          phone: parts[7] || '',
          password: parts[8] || generatePassword(),
          country: 'DE'
        };
      });
      
      console.log(`✅ Parsed ${accounts.length} accounts from clipboard`);
      return accounts;
    }
  } catch (error) {
    console.error('❌ Failed to read clipboard:', error.message);
    return [];
  }
}

/**
 * Parse from web page (using Playwright)
 */
async function parseWebPage(url) {
  console.log(`\n🌐 Parsing web page: ${url}`);
  
  const { chromium } = require('playwright');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto(url);
  
  // Try to extract account data from common table structures
  const accounts = await page.evaluate(() => {
    const results = [];
    
    // Try to find tables
    const tables = document.querySelectorAll('table');
    
    tables.forEach(table => {
      const rows = table.querySelectorAll('tr');
      
      rows.forEach((row, index) => {
        // Skip header row
        if (index === 0) return;
        
        const cells = row.querySelectorAll('td');
        if (cells.length < 3) return;
        
        // Try to extract email, name, etc
        const data = {};
        
        cells.forEach((cell, i) => {
          const text = cell.textContent.trim();
          
          // Try to detect email
          if (text.includes('@')) {
            data.email = text;
          }
          // Try to detect phone
          else if (text.match(/^\+?\d{10,15}$/)) {
            data.phone = text;
          }
          // Try to detect zip code
          else if (text.match(/^\d{5}$/)) {
            data.zipCode = text;
          }
          // Other text might be name or address
          else if (text.length > 0 && text.length < 100) {
            if (!data.name) {
              data.name = text;
            } else if (!data.address) {
              data.address = text;
            }
          }
        });
        
        if (data.email) {
          results.push(data);
        }
      });
    });
    
    return results;
  });
  
  await browser.close();
  
  // Normalize extracted data
  const normalized = accounts.map(acc => {
    const nameParts = (acc.name || '').split(' ');
    
    return {
      email: acc.email,
      gender: 'Herr',
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      address: acc.address || '',
      zipCode: acc.zipCode || '',
      city: '',
      phone: acc.phone || '',
      password: generatePassword(),
      country: 'DE'
    };
  });
  
  console.log(`✅ Parsed ${normalized.length} accounts from web page`);
  return normalized;
}

/**
 * Generate secure password
 */
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Save accounts to JSON file
 */
function saveAccounts(accounts, outputPath) {
  const data = {
    generated: new Date().toISOString(),
    count: accounts.length,
    accounts: accounts.map(acc => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: 'pending',
      ...acc
    }))
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`\n💾 Saved to: ${outputPath}`);
}

/**
 * Display summary
 */
function displaySummary(accounts) {
  console.log('\n' + '═'.repeat(60));
  console.log(`📊 PARSED ACCOUNTS SUMMARY`);
  console.log('═'.repeat(60));
  console.log(`Total accounts: ${accounts.length}`);
  console.log(`With email: ${accounts.filter(a => a.email).length}`);
  console.log(`With phone: ${accounts.filter(a => a.phone).length}`);
  console.log(`With address: ${accounts.filter(a => a.address).length}`);
  console.log(`Male (Herr): ${accounts.filter(a => a.gender === 'Herr').length}`);
  console.log(`Female (Frau): ${accounts.filter(a => a.gender === 'Frau').length}`);
  console.log('═'.repeat(60));
  
  // Show first 3 accounts as preview
  if (accounts.length > 0) {
    console.log('\n📋 PREVIEW (first 3 accounts):');
    accounts.slice(0, 3).forEach((acc, i) => {
      console.log(`\n${i + 1}. ${acc.gender} ${acc.firstName} ${acc.lastName}`);
      console.log(`   Email: ${acc.email}`);
      console.log(`   Phone: ${acc.phone}`);
      console.log(`   Address: ${acc.address}, ${acc.zipCode} ${acc.city}`);
      console.log(`   Password: ${acc.password}`);
    });
    
    if (accounts.length > 3) {
      console.log(`\n   ... and ${accounts.length - 3} more`);
    }
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Otto.de Account Data Parser

Usage:
  node parse-accounts.cjs <input-file>           # Parse CSV or JSON file
  node parse-accounts.cjs --url <web-url>        # Parse web page
  node parse-accounts.cjs --clipboard            # Parse from clipboard
  node parse-accounts.cjs --interactive          # Interactive mode

Examples:
  node parse-accounts.cjs accounts.csv
  node parse-accounts.cjs data.json
  node parse-accounts.cjs --url https://example.com/accounts
  node parse-accounts.cjs --clipboard
  
Output will be saved to: data/registered-accounts.json
    `);
    process.exit(0);
  }
  
  let accounts = [];
  
  // Parse based on input type
  if (args[0] === '--url') {
    accounts = await parseWebPage(args[1]);
  } else if (args[0] === '--clipboard' || args[0] === '--interactive') {
    accounts = await parseClipboard();
  } else {
    const inputPath = args[0];
    const ext = path.extname(inputPath).toLowerCase();
    
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ File not found: ${inputPath}`);
      process.exit(1);
    }
    
    if (ext === '.json') {
      accounts = parseJSON(inputPath);
    } else {
      // Assume CSV
      accounts = parseCSV(inputPath);
    }
  }
  
  if (accounts.length === 0) {
    console.error('\n❌ No accounts parsed');
    process.exit(1);
  }
  
  // Display summary
  displaySummary(accounts);
  
  // Save to output
  const outputPath = path.join(process.cwd(), 'data', 'registered-accounts.json');
  const outputDir = path.dirname(outputPath);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  saveAccounts(accounts, outputPath);
  
  console.log('\n✅ Done! You can now load these accounts in the registration page.');
  console.log('\n💡 Next steps:');
  console.log('   1. Open https://otto-qa-runner.vercel.app/register.html');
  console.log('   2. Click "📂 Load Saved Accounts"');
  console.log('   3. Bind profiles and start registration\n');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = {
  parseCSV,
  parseJSON,
  parseClipboard,
  parseWebPage,
  saveAccounts
};
