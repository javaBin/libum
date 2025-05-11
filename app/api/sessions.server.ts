import ENV from '~/env.server';
import { getCachedConferences, getCachedSessions } from '~/utils/sessionsCache.server';

export interface Conference {
  id: string;
  slug: string;
  name: string;
  slottimes?: string;
  year: string;
}

export interface Speaker {
  name: string;
  bio?: string;
  twitter?: string;
  pictureUrl?: string;
}

export interface Session {
  sessionId: string;
  title: string;
  abstract: string;
  intendedAudience?: string;
  language?: string;
  format?: string;
  level?: string;
  keywords?: string[];
  speakers: Speaker[];
}

// Local cache as fallback
const localSessionsCache: Record<string, any[]> = {};

/**
 * Fetch the list of JavaZone conferences.
 * This will use the global cache first (which is initialized at server startup).
 * Falls back to direct API call if needed.
 */
export async function getConferences(): Promise<Conference[]> {
  try {
    // Get conferences from the global cache
    return await getCachedConferences();
  } catch (error) {
    console.warn('Error getting conferences from global cache, falling back to API:', error);
    
    // Fall back to direct API call
    if (!ENV.MORESLEEP_BASIC_AUTH) {
      console.error('Missing MORESLEEP_BASIC_AUTH environment variable');
      throw new Error('Authorization credentials missing. Check your .env file.');
    }

    const basicAuth = Buffer.from(ENV.MORESLEEP_BASIC_AUTH).toString('base64');
    console.log('Fetching conferences with auth headers');
    
    try {
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
    } catch (error) {
      console.error('Error fetching conferences:', error);
      throw error;
    }
  }
}

/**
 * Fetch the sessions for a given conference ID.
 * This will use the global cache first (which is initialized at server startup).
 * Falls back to direct API call if needed.
 */
export async function getSessions(conferenceId: string): Promise<any[]> {
  try {
    // Get sessions from the global cache
    return await getCachedSessions(conferenceId);
  } catch (error) {
    console.warn(`Error getting sessions for conference ${conferenceId} from global cache, falling back to local/API:`, error);
    
    // Check local cache as fallback
    if (localSessionsCache[conferenceId]) {
      console.log(`[LocalCache] Returning cached sessions for conference ${conferenceId}`);
      return localSessionsCache[conferenceId];
    }

    // Fall back to direct API call
    if (!ENV.MORESLEEP_BASIC_AUTH) {
      console.error('Missing MORESLEEP_BASIC_AUTH environment variable');
      throw new Error('Authorization credentials missing. Check your .env file.');
    }

    const basicAuth = Buffer.from(ENV.MORESLEEP_BASIC_AUTH).toString('base64');
    console.log(`Fetching sessions for conference ${conferenceId} with auth headers`);
    
    try {
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
      const result = Array.isArray(data)
        ? data
        : Array.isArray(data.sessions)
          ? data.sessions
          : [];
          
      // Cache the fetched sessions locally as well
      localSessionsCache[conferenceId] = result;
      console.log(`[LocalCache] Cached ${result.length} sessions for conference ${conferenceId}`);
      return result;
    } catch (error) {
      console.error(`Error fetching sessions for ${conferenceId}:`, error);
      throw error;
    }
  }
} 