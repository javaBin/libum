import type { TalkDetail } from '~/types/talk';

interface RawCache {
  [year: string]: {
    [id: string]: TalkDetail; // Store TalkDetail objects
  };
}

let rawSessionsCache: RawCache = {};

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

export function getRawSession(year: string, id: string): TalkDetail | undefined {
  const session = rawSessionsCache[year]?.[id];
  if (session) {
    console.log(`[RawSessionCache] Cache hit for session ID '${id}' in year '${year}'.`);
  } else {
    console.log(`[RawSessionCache] Cache miss for session ID '${id}' in year '${year}'.`);
  }
  return session;
}

export function clearRawCache(): void {
  rawSessionsCache = {};
  console.log('[RawSessionCache] Raw sessions cache cleared.');
} 