import React, { useState, useEffect } from 'react';
import { Outlet, useLoaderData, useOutletContext } from '@remix-run/react';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getConferences, getSessions } from '~/api/sessions.server';
import { mapSessionData } from '~/utils/sessions';
import { setRawSessions } from '../utils/rawSessionCache.client';
import type { TalkDetail } from '~/types/talk';

// Types for loader and context
export type Conference = { id: string; name: string; slug: string; year: string };
export type Session = {
  id: string;
  sessionId: string;
  title: string;
  format: string;
  length: string;
  language: string;
  abstract: string;
  room: string;
  startTime: string;
  endTime: string;
  video: string;
  speakers: any[];
  status?: string;
  tags: string[];
};

export interface SubmissionsContextType {
  sessions: Session[];
  rawSessions: TalkDetail[];
  selectedYear: string;
  availableConferences: Conference[];
  isFutureYear: boolean;
  error?: string;
  filters: {
    title: string;
    author: string;
    format: string;
    tag: string;
    status: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<SubmissionsContextType['filters']>>;
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const yearParam = url.searchParams.get('year');
  let availableConferences: Conference[] = [];
  let selectedYear = '';
  let isFutureYear = false;
  let sessions: Session[] = [];
  let rawSessions: TalkDetail[] = [];
  let error: string | undefined = undefined;

  try {
    console.log('Fetching conferences...');
    const rawConfs = await getConferences();
    availableConferences = rawConfs.sort((a, b) => b.year.localeCompare(a.year));
    selectedYear = yearParam || availableConferences[0]?.year || '';
    isFutureYear = parseInt(selectedYear, 10) > new Date().getFullYear();
    
    const sel = availableConferences.find(c => c.year === selectedYear);
    
    if (sel) {
      console.log(`Fetching sessions for ${sel.name} (${sel.id})...`);
      try {
        const fetchedRawSessions = await getSessions(sel.id);
        rawSessions = fetchedRawSessions;
        sessions = mapSessionData(rawSessions, selectedYear);
        console.log(`Successfully loaded ${sessions.length} sessions for ${sel.name}`);
      } catch (sessionError: any) {
        console.error('Error fetching sessions:', sessionError);
        error = `Error loading sessions: ${sessionError.message || 'Unknown error'}`;
      }
    } else if (availableConferences.length > 0) {
      error = `No conference found for year ${selectedYear}`;
    }
  } catch (confError: any) {
    console.error('Error fetching conferences:', confError);
    error = `Error loading conferences: ${confError.message || 'Unknown error'}`;
  }

  return json({ 
    rawSessions, 
    sessions, 
    selectedYear, 
    availableConferences, 
    isFutureYear,
    error
  });
};

export default function SubmissionsLayout() {
  const loaderData = useLoaderData<typeof loader>();
  const [filters, setFilters] = useState({ title: '', author: '', format: '', tag: '', status: '' });

  useEffect(() => {
    if (loaderData.rawSessions && loaderData.selectedYear) {
      setRawSessions(loaderData.selectedYear, loaderData.rawSessions);
    }
  }, [loaderData.rawSessions, loaderData.selectedYear]);

  return (
    <Outlet context={{
      sessions: loaderData.sessions,
      rawSessions: loaderData.rawSessions,
      selectedYear: loaderData.selectedYear,
      availableConferences: loaderData.availableConferences,
      isFutureYear: loaderData.isFutureYear,
      error: loaderData.error,
      filters,
      setFilters,
    }} />
  );
}

// Hook for children to access submissions context
export function useSubmissionsContext() {
  return useOutletContext<SubmissionsContextType>();
} 