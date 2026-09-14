/**
 * Profile Metadata Storage
 * Stores login status and other metadata for browser profiles
 */

const fs = require('fs');
const path = require('path');

// Storage file path
const METADATA_FILE = path.join(__dirname, '../data/profile-metadata.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(METADATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Load metadata from file
 */
function loadMetadata() {
  ensureDataDir();
  
  if (!fs.existsSync(METADATA_FILE)) {
    return {};
  }
  
  try {
    const data = fs.readFileSync(METADATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading metadata:', error);
    return {};
  }
}

/**
 * Save metadata to file
 */
function saveMetadata(metadata) {
  ensureDataDir();
  
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving metadata:', error);
    return false;
  }
}

/**
 * Get profile key (provider:profileId)
 */
function getProfileKey(profileId, provider = 'adspower') {
  return `${provider}:${profileId}`;
}

/**
 * Get metadata for a profile
 */
function getProfileMetadata(profileId, provider = 'adspower') {
  const metadata = loadMetadata();
  const key = getProfileKey(profileId, provider);
  return metadata[key] || {};
}

/**
 * Set metadata for a profile
 */
function setProfileMetadata(profileId, provider = 'adspower', data) {
  const metadata = loadMetadata();
  const key = getProfileKey(profileId, provider);
  
  // Merge with existing metadata
  metadata[key] = {
    ...metadata[key],
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  saveMetadata(metadata);
  return metadata[key];
}

/**
 * Tag a profile as logged in
 */
function tagProfileLoggedIn(profileId, provider = 'adspower', site = 'otto.de') {
  const data = {
    [`loggedIn_${site}`]: true,
    [`loginDate_${site}`]: new Date().toISOString(),
    [`loginVerified_${site}`]: true
  };
  
  return setProfileMetadata(profileId, provider, data);
}

/**
 * Check if profile is logged in to a site
 */
function isProfileLoggedIn(profileId, provider = 'adspower', site = 'otto.de') {
  const metadata = getProfileMetadata(profileId, provider);
  return metadata[`loggedIn_${site}`] === true;
}

/**
 * Get login date for a profile
 */
function getLoginDate(profileId, provider = 'adspower', site = 'otto.de') {
  const metadata = getProfileMetadata(profileId, provider);
  return metadata[`loginDate_${site}`] || null;
}

/**
 * Get days since login
 */
function getDaysSinceLogin(profileId, provider = 'adspower', site = 'otto.de') {
  const loginDate = getLoginDate(profileId, provider, site);
  
  if (!loginDate) {
    return null;
  }
  
  const now = new Date();
  const login = new Date(loginDate);
  const diffMs = now - login;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Clear login status for a profile
 */
function clearProfileLogin(profileId, provider = 'adspower', site = 'otto.de') {
  const data = {
    [`loggedIn_${site}`]: false,
    [`loginDate_${site}`]: null,
    [`loginCleared_${site}`]: new Date().toISOString()
  };
  
  return setProfileMetadata(profileId, provider, data);
}

/**
 * Get all logged-in profiles for a site
 */
function getLoggedInProfiles(site = 'otto.de') {
  const metadata = loadMetadata();
  const loggedInProfiles = [];
  
  for (const [key, data] of Object.entries(metadata)) {
    if (data[`loggedIn_${site}`] === true) {
      const [provider, profileId] = key.split(':');
      loggedInProfiles.push({
        profileId,
        provider,
        loginDate: data[`loginDate_${site}`],
        daysSinceLogin: getDaysSinceLogin(profileId, provider, site)
      });
    }
  }
  
  return loggedInProfiles;
}

/**
 * Add custom tag to profile
 */
function addProfileTag(profileId, provider = 'adspower', tag) {
  const metadata = getProfileMetadata(profileId, provider);
  const tags = metadata.tags || [];
  
  if (!tags.includes(tag)) {
    tags.push(tag);
  }
  
  return setProfileMetadata(profileId, provider, { tags });
}

/**
 * Remove tag from profile
 */
function removeProfileTag(profileId, provider = 'adspower', tag) {
  const metadata = getProfileMetadata(profileId, provider);
  const tags = metadata.tags || [];
  
  const filteredTags = tags.filter(t => t !== tag);
  
  return setProfileMetadata(profileId, provider, { tags: filteredTags });
}

/**
 * Get profiles by tag
 */
function getProfilesByTag(tag) {
  const metadata = loadMetadata();
  const profiles = [];
  
  for (const [key, data] of Object.entries(metadata)) {
    if (data.tags && data.tags.includes(tag)) {
      const [provider, profileId] = key.split(':');
      profiles.push({ profileId, provider, ...data });
    }
  }
  
  return profiles;
}

/**
 * Export all metadata (for debugging)
 */
function exportMetadata() {
  return loadMetadata();
}

/**
 * Import metadata (for backup/restore)
 */
function importMetadata(data) {
  return saveMetadata(data);
}

module.exports = {
  getProfileMetadata,
  setProfileMetadata,
  tagProfileLoggedIn,
  isProfileLoggedIn,
  getLoginDate,
  getDaysSinceLogin,
  clearProfileLogin,
  getLoggedInProfiles,
  addProfileTag,
  removeProfileTag,
  getProfilesByTag,
  exportMetadata,
  importMetadata
};
