import ENV from '~/env.server';
import type { Conference } from '~/api/sessions.server';
import type { TalkDetail } from '~/types/talk';

// Global cache for conference and session data
const conferencesCache: Conference[] = [];
const sessionsCache: Record<string, TalkDetail[]> = {};

// Flag to track if cache has been initialized
let cacheInitialized = false;
let cacheInitializing = false;

/**
 * Direct API call to fetch conferences
 * This avoids the circular dependency with sessions.server.ts
 */
async function fetchConferencesFromApi(): Promise<Conference[]> {
  if (!ENV.MORESLEEP_BASIC_AUTH) {
    console.error('Missing MORESLEEP_BASIC_AUTH environment variable');
    throw new Error('Authorization credentials missing. Check your .env file.');
  }

  const basicAuth = Buffer.from(ENV.MORESLEEP_BASIC_AUTH).toString('base64');
  console.log('[GlobalCache] Directly fetching conferences from API');
  
  const res = await fetch('https://sleepingpill.javazone.no/data/conference', {
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Accept': 'application/json',
    },
  });
  
  if (!res.ok) {
    console.error(`Failed to fetch conferences: ${res.status} ${res.statusText}`);
    if (res.status === 401) {
      throw new Error('Authorization failed. Check your credentials in .env file.');
    }
    throw new Error(`Failed to fetch conferences: ${res.status} ${res.statusText}`);
  }
  
  const json = await res.json();
  const raw = Array.isArray(json.conferences) ? json.conferences : [];
  return raw.map((c: any) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    slottimes: c.slottimes,
    year: c.slug.split('_')[1],
  }));
}

/**
 * Direct API call to fetch sessions for a conference
 * This avoids the circular dependency with sessions.server.ts
 */
async function fetchSessionsFromApi(conferenceId: string): Promise<any[]> {
  if (!ENV.MORESLEEP_BASIC_AUTH) {
    console.error('Missing MORESLEEP_BASIC_AUTH environment variable');
    throw new Error('Authorization credentials missing. Check your .env file.');
  }

  const basicAuth = Buffer.from(ENV.MORESLEEP_BASIC_AUTH).toString('base64');
  console.log(`[GlobalCache] Directly fetching sessions for conference ${conferenceId} from API`);
  
  const res = await fetch(`https://sleepingpill.javazone.no/data/conference/${conferenceId}/session`, {
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Accept': 'application/json',
    },
  });
  
  if (!res.ok) {
    console.error(`Failed to fetch sessions for ${conferenceId}: ${res.status} ${res.statusText}`);
    if (res.status === 401) {
      throw new Error('Authorization failed. Check your credentials in .env file.');
    }
    throw new Error(`Failed to fetch sessions for ${conferenceId}: ${res.status} ${res.statusText}`);
  }
  
  const raw = await res.text();
  let parsedData;
  try {
    parsedData = JSON.parse(raw);
  } catch (err) {
    console.warn('Error parsing JSON, attempting to sanitize:', err);
    const sanitized = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
    parsedData = JSON.parse(sanitized);
  }
  
  const data = parsedData;
  return Array.isArray(data)
    ? data
    : Array.isArray(data.sessions)
      ? data.sessions
      : [];
}

/**
 * Initialize the global cache by fetching all conferences and all sessions
 */
export async function initializeCache(): Promise<void> {
  if (cacheInitialized || cacheInitializing) {
    return;
  }
  
  cacheInitializing = true;
  try {
    console.log('Initializing global sessions cache...');
    
    // Clear existing cache
    conferencesCache.length = 0;
    Object.keys(sessionsCache).forEach(key => delete sessionsCache[key]);
    
    // 1. Get all conferences directly from API
    const fetchedConferences = await fetchConferencesFromApi();
    fetchedConferences.forEach(conf => conferencesCache.push(conf));
    
    // 2. For each conference, get all sessions directly from API
    for (const conference of conferencesCache) {
      const fetchedSessions = await fetchSessionsFromApi(conference.id);
      sessionsCache[conference.id] = fetchedSessions;
      console.log(`[GlobalCache] Cached ${fetchedSessions.length} sessions for ${conference.name} (${conference.id})`);
    }
    
    cacheInitialized = true;
    console.log(`[GlobalCache] Initialization complete. Cached ${conferencesCache.length} conferences`);
  } catch (error) {
    console.error('[GlobalCache] Error initializing cache:', error);
    throw error;
  } finally {
    cacheInitializing = false;
  }
}

/**
 * Get all conferences from the cache, initializing it if necessary
 */
export async function getCachedConferences(): Promise<Conference[]> {
  if (!cacheInitialized) {
    await initializeCache();
  }
  return [...conferencesCache];
}

/**
 * Get sessions for a specific conference from the cache
 */
export async function getCachedSessions(conferenceId: string): Promise<TalkDetail[]> {
  if (!cacheInitialized) {
    await initializeCache();
  }
  
  if (!sessionsCache[conferenceId]) {
    throw new Error(`No cached sessions found for conference ID: ${conferenceId}`);
  }
  
  return [...sessionsCache[conferenceId]];
}

/**
 * Get a specific session from the cache by ID
 */
export async function getCachedSession(sessionId: string): Promise<TalkDetail | null> {
  if (!cacheInitialized) {
    await initializeCache();
  }
  
  // Search through all conferences for the session
  for (const conferenceId of Object.keys(sessionsCache)) {
    const session = sessionsCache[conferenceId].find(s => s.id === sessionId);
    if (session) {
      return session;
    }
  }
  
  return null;
} 