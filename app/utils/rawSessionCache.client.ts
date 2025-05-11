import type { TalkDetail } from '~/types/talk';

interface RawCache {
  [year: string]: {
    [id: string]: TalkDetail; // Store TalkDetail objects
  };
}

let rawSessionsCache: RawCache = {};

/**
 * Store sessions in the client-side cache, organized by year.
 * This is populated from data that comes from the server-side cache.
 */
export function setRawSessions(year: string, sessions: TalkDetail[]): void {
  if (!rawSessionsCache[year]) {
    rawSessionsCache[year] = {};
  }
  sessions.forEach(session => {
    // The session ID for caching should be the clean one, consistent with how slugs are used.
    // Assuming session.id is the correct, clean ID.
    if (session.id) { 
        rawSessionsCache[year][session.id] = session;
    }
  });
  console.log(`[RawSessionCache] Cached ${sessions.length} raw detailed sessions for ${year}.`);
}

/**
 * Get a session from the client-side cache by year and ID.
 * This avoids unnecessary server requests for data we already have.
 */
export function getRawSession(year: string, id: string): TalkDetail | undefined {
  const session = rawSessionsCache[year]?.[id];
  if (session) {
    console.log(`[RawSessionCache] Cache hit for session ID '${id}' in year '${year}'.`);
  } else {
    console.log(`[RawSessionCache] Cache miss for session ID '${id}' in year '${year}'.`);
  }
  return session;
}

/**
 * Clear the client-side cache
 */
export function clearRawCache(): void {
  rawSessionsCache = {};
  console.log('[RawSessionCache] Raw sessions cache cleared.');
} 