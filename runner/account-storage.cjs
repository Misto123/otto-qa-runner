/**
 * Account Data Persistence
 * Saves generated accounts to JSON file for later use
 */

const fs = require('fs');
const path = require('path');

const ACCOUNTS_FILE = path.join(__dirname, '../data/registered-accounts.json');

/**
 * Ensure data directory exists
 */
function ensureDataDir() {
  const dataDir = path.dirname(ACCOUNTS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Load all saved accounts
 */
function loadAccounts() {
  ensureDataDir();
  
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading accounts:', error);
    return [];
  }
}

/**
 * Save account data
 */
function saveAccount(accountData) {
  ensureDataDir();
  
  const accounts = loadAccounts();
  
  // Add timestamp and ID
  const account = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...accountData
  };
  
  accounts.push(account);
  
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf8');
    return account;
  } catch (error) {
    console.error('Error saving account:', error);
    throw error;
  }
}

/**
 * Save multiple accounts
 */
function saveAccounts(accountsData) {
  ensureDataDir();
  
  const existingAccounts = loadAccounts();
  
  const newAccounts = accountsData.map(acc => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
    ...acc
  }));
  
  const allAccounts = [...existingAccounts, ...newAccounts];
  
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(allAccounts, null, 2), 'utf8');
    return newAccounts;
  } catch (error) {
    console.error('Error saving accounts:', error);
    throw error;
  }
}

/**
 * Update account with registration result
 */
function updateAccount(accountId, updates) {
  const accounts = loadAccounts();
  
  const index = accounts.findIndex(acc => acc.id === accountId || acc.email === accountId);
  
  if (index === -1) {
    throw new Error('Account not found');
  }
  
  accounts[index] = {
    ...accounts[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf8');
    return accounts[index];
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
}

/**
 * Get accounts by status
 */
function getAccountsByStatus(status) {
  const accounts = loadAccounts();
  return accounts.filter(acc => acc.status === status);
}

/**
 * Get accounts by profile binding
 */
function getAccountsByProfile(profileId) {
  const accounts = loadAccounts();
  return accounts.filter(acc => acc.profileId === profileId);
}

/**
 * Export accounts to CSV
 */
function exportAccountsToCSV() {
  const accounts = loadAccounts();
  
  if (accounts.length === 0) {
    return 'No accounts to export';
  }
  
  const headers = ['id', 'email', 'password', 'gender', 'firstName', 'lastName', 'address', 'zipCode', 'city', 'phone', 'country', 'profileId', 'status', 'createdAt'];
  
  const csv = [
    headers.join(','),
    ...accounts.map(acc => 
      headers.map(h => {
        const val = acc[h] || '';
        // Escape commas and quotes
        return val.toString().includes(',') ? `"${val}"` : val;
      }).join(',')
    )
  ].join('\n');
  
  return csv;
}

module.exports = {
  loadAccounts,
  saveAccount,
  saveAccounts,
  updateAccount,
  getAccountsByStatus,
  getAccountsByProfile,
  exportAccountsToCSV
};
