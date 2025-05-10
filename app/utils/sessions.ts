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
  speakers: { name: string }[];
  status?: string;
  tags: string[];
};

export function mapSessionData(sessionsData: any[], year: string): Session[] {
  if (!sessionsData || sessionsData.length === 0) return [];
  return sessionsData.map((session: any) => {
    const cleanId = (originalId: string | undefined) => originalId ? originalId.replace(/:1$/, '') : undefined;
    const id = cleanId(session.id || session.sessionId);
    const sessionId = cleanId(session.sessionId || session.id);

    const title = session.data?.title?.value || session.title || 'Untitled Session';
    const abstract = session.data?.abstract?.value || session.abstract || '';
    const format = session.data?.format?.value || session.format || 'presentation';
    const length = session.data?.length?.value || session.length || '45';
    let speakers: { name: string }[] = [];
    if (Array.isArray(session.speakers)) {
      speakers = session.speakers.map((s: any) => ({ name: s.name || 'Unknown Speaker' }));
    }
    return {
      id: id || '',
      sessionId: sessionId || '',
      title,
      abstract,
      format,
      length,
      language: session.data?.language?.value || session.language || 'en',
      speakers,
      status: session.status || 'confirmed',
      room: session.data?.room?.value || session.room || '',
      startTime: session.data?.startTime?.value || session.startTime || '',
      endTime: session.data?.endTime?.value || session.endTime || '',
      video: session.data?.video?.value || session.video || '',
      tags: Array.isArray(session.data?.tagswithauthor?.value)
        ? session.data.tagswithauthor.value.map((e: any) => e.tag)
        : [],
    };
  });
} 