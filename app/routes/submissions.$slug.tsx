import { useLoaderData, Link, useNavigate, useFetcher, type ClientLoaderFunctionArgs } from "@remix-run/react";
import { json, type LoaderFunction } from "@remix-run/node";
import { getRawSession } from '../utils/rawSessionCache.client';
import type { TalkDetail } from "~/types/talk";
import { useEffect } from "react";
import { useSubmissionsContext } from "./submissions";
import { getConferences, getSessions } from '~/api/sessions.server';

// Internal API types
interface SocialMediaData {
    privateData: boolean;
    value: string;
}

interface SpeakerData {
    twitter: SocialMediaData;
    bio: SocialMediaData;
    "zip-code": SocialMediaData;
    residence: SocialMediaData;
}

interface Speaker {
    name: string;
    id: string;
    data: SpeakerData;
    email: string;
}

interface SessionUpdate {
    hasUnpublishedChanges: boolean;
    speakerUpdates: any[]; // You can define more specific types if needed
    oldValues: any[]; // You can define more specific types if needed
}

interface TalkUpdate {
    talkid: string;
    updatedBy: string;
    updatedAt: string;
}

interface ConferenceData {
    participation: SocialMediaData;
    intendedAudience: SocialMediaData;
    outline: SocialMediaData;
    suggestedKeywords: SocialMediaData;
    length: SocialMediaData;
    format: SocialMediaData;
    infoToProgramCommittee: SocialMediaData;
    equipment: SocialMediaData;
    language: SocialMediaData;
    abstract: SocialMediaData;
    title: SocialMediaData;
    pkomfeedbacks: PkomFeedback[];
    tagswithauthor: TagWithAuthor[];
    tags: SocialMediaData;
    room: SocialMediaData;
    startTime: SocialMediaData;
    endTime: SocialMediaData;
    video: SocialMediaData;
}

interface PkomFeedback {
    author: string;
    created: string;
    id: string;
    talkid: string;
    feedbacktype: string;
    info: string;
}

interface TagWithAuthor {
    author: string;
    tag: string;
}

interface InternalSession {
    conferenceId: string;
    speakers: Speaker[];
    sessionUpdates: SessionUpdate;
    talkUpdates: TalkUpdate[];
    postedBy: string;
    lastUpdated: string;
    sessionId: string;
    id: string;
    data: ConferenceData;
    status: string;
}

// Public API types
interface PublicSpeaker {
    name: string;
    twitter: string;
    bio: string;
}

interface PublicSession {
    intendedAudience: string;
    length: string;
    format: string;
    language: string;
    abstract: string;
    title: string;
    room: string;
    startTime: string;
    endTime: string;
    video: string;
    startTimeZulu: string;
    endTimeZulu: string;
    id: string;
    sessionId: string;
    conferenceId: string;
    startSlot: string;
    startSlotZulu: string;
    speakers: PublicSpeaker[];
}

// Union type for session data
// Removed SessionData union; using TalkDetail for session

// Response type including authentication status
interface LoaderResponse {
    session: TalkDetail;
    isAuthenticated: boolean;
    authError: string | null;
    year: string;
    otherTalksBySpeaker: Record<string, { currentYear: any[]; other: any[] }>;
    _fromClientCache?: boolean;
}

export const loader: LoaderFunction = async ({ params, request }) => {
    const slugWithOptionalJson = params.slug;
    if (!slugWithOptionalJson) {
        throw new Response("Session ID is required", { status: 400 });
    }
    const slug = slugWithOptionalJson.endsWith('.json')
        ? slugWithOptionalJson.slice(0, -5)
        : slugWithOptionalJson;

    if (!slug) {
        throw new Response("Valid Session ID is required after stripping .json", { status: 400 });
    }
    const url = new URL(request.url);
    const year = url.searchParams.get("year") || "2023";
    const credentials = process.env.MORESLEEP_BASIC_AUTH;
    if (!credentials) {
        // Not throwing here, to allow clientLoader to potentially serve public data
        // The actual fetch will fail if auth is needed and not provided.
        console.warn("Authentication credentials missing for server fetch.");
    }
    const basicAuth = credentials ? Buffer.from(credentials).toString("base64") : '';
    const response = await fetch(
        `https://sleepingpill.javazone.no/data/session/${slug}`,
        { headers: { Authorization: `Basic ${basicAuth}`, Accept: "application/json" } }
    );
    if (!response.ok) {
        // If auth failed (401) or other error, this will be caught
        throw new Response(`Failed to fetch session: ${response.status} ${response.statusText}`, { status: response.status });
    }
    const session = (await response.json()) as TalkDetail;

    // Fetch all conferences and their sessions to group by speaker
    const conferences = await getConferences();
    const allSessionsByYear: Record<string, any[]> = {};
    for (const conf of conferences) {
        const rawSessions = await getSessions(conf.id);
        // Attach year to each session
        allSessionsByYear[conf.year] = rawSessions.map(rs => ({ ...rs, year: conf.year }));
    }
    // Group other talks by speaker email
    const otherTalksBySpeaker: Record<string, { currentYear: any[]; other: any[] }> = {};
    for (const sp of session.speakers) {
        const email = sp.email;
        const currentList = allSessionsByYear[year] || [];
        const currentYearSessions = currentList.filter((rs: any) => rs.speakers.some((s2: any) => s2.email === email) && rs.id !== session.id);
        const other: any[] = [];
        for (const y of Object.keys(allSessionsByYear)) {
            if (y === year) continue;
            other.push(...allSessionsByYear[y].filter((rs: any) => rs.speakers.some((s2: any) => s2.email === email)));
        }
        otherTalksBySpeaker[email] = { currentYear: currentYearSessions, other };
    }

    return json(
        { session, isAuthenticated: !!credentials, authError: null, year, otherTalksBySpeaker },
        { headers: { 'Cache-Control': 'public, max-age=86400' } }
    );
};

export async function clientLoader({ request, params, serverLoader }: ClientLoaderFunctionArgs): Promise<LoaderResponse> {
    const slugParam = params.slug;
    if (!slugParam) {
        console.warn('[ClientLoader] No slug parameter, deferring to server loader.');
        const result = await serverLoader();
        return result as LoaderResponse;
    }

    const slug = slugParam.endsWith('.json') ? slugParam.slice(0, -5) : slugParam;
    const year = new URL(request.url).searchParams.get("year") || "2023";

    const cachedTalkDetail = getRawSession(year, slug);

    if (cachedTalkDetail) {
        console.log(`[ClientLoader] Cache hit for session '${slug}'. Delegating to server loader to fetch other talks.`);
        const fullResult = await serverLoader() as LoaderResponse;
        return {
            ...fullResult,
            session: cachedTalkDetail
        };
    }

    console.log(`[ClientLoader] Talk ID '${slug}' for year '${year}' not in client cache. Deferring to server loader.`);
    const serverResult = await serverLoader();
    return serverResult as LoaderResponse;
}

export default function SessionDetail() {
    const { session, isAuthenticated, authError, year, otherTalksBySpeaker } = useLoaderData<typeof loader>() as LoaderResponse;
    const navigate = useNavigate();
    const fetcher = useFetcher();
    const { sessions, filters } = useSubmissionsContext();
    const { title: titleFilter, author: authorFilter, format: formatFilter, tag: tagFilter, status: statusFilter } = filters;
    const filteredSessions = sessions.filter(s => {
        if (titleFilter && !s.title.toLowerCase().includes(titleFilter.toLowerCase())) return false;
        if (authorFilter && !s.speakers.some(sp => sp.name.toLowerCase().includes(authorFilter.toLowerCase()))) return false;
        if (formatFilter && s.format !== formatFilter) return false;
        if (tagFilter && !s.tags.includes(tagFilter)) return false;
        if (statusFilter && s.status !== statusFilter) return false;
        return true;
    });
    const currentIndex = filteredSessions.findIndex(s => s.id === session.id);
    const prevId = filteredSessions[currentIndex - 1]?.id;
    const prevPrevId = filteredSessions[currentIndex - 2]?.id;
    const nextId = filteredSessions[currentIndex + 1]?.id;
    const nextNextId = filteredSessions[currentIndex + 2]?.id;

    useEffect(() => {
        // Keyboard navigation between talks
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && prevId) navigate(`/submissions/${prevId}?year=${year}`);
            if (e.key === 'ArrowRight' && nextId) navigate(`/submissions/${nextId}?year=${year}`);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [prevId, nextId, navigate, year]);

    // Use TalkDetail session
    const talk = session;
    const data = talk.data;
    const title = data.title.value;
    const abstract = data.abstract?.value;
    const format = data.format?.value;
    const language = data.language?.value;
    const length = data.length?.value;
    const intendedAudience = data.intendedAudience?.value;
    const room = data.room?.value;
    const startTime = data.startTime?.value;
    const endTime = data.endTime?.value;
    const tagsWithAuthor = data.tagswithauthor?.value ?? [];
    const pkoms = data.pkomfeedbacks?.value ?? [];
    const ratingMap: Record<string, number> = {'--': -2, '-': -1, '0': 0, '+': 1, '++': 2};
    const ratingFeedbacks = pkoms.filter(fb => fb.feedbacktype.toLowerCase() === 'talk_rating');
    const ratingValues = ratingFeedbacks.map(fb => ratingMap[fb.info] ?? 0);
    const avgRating = ratingValues.length > 0 ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length : 0;
    const ratingPosition = ((avgRating + 2) / 4) * 100;
    const commentFeedbacks = pkoms.filter(fb => fb.feedbacktype.toLowerCase() === 'comment');
    
    // Format the date/time
    const formatDateTime = (dateTimeStr: string) => {
        if (!dateTimeStr) return "N/A";
        try {
            const date = new Date(dateTimeStr);
            return new Intl.DateTimeFormat('no-NO', {
                dateStyle: 'full',
                timeStyle: 'short'
            }).format(date);
        } catch (e) {
            return dateTimeStr;
        }
    };

    // Tag color categories
    const deniedTags = ['nei', 'no',"rejected"];
    const acceptedTags = ['accepted','dinner','confirmed','ja','ai','arch','bankers','core','data','devex','duplikat','exp','front','infra','lang','lightning','misc','ops','popcorn','proc','qa','sec'];

    // Helper to render rating balls based on feedback info
    const getRatingBalls = (rating: string) => {
        const ball = (colorClass: string, idx: number) => (
            <span key={idx} className={`inline-block w-3 h-3 rounded-full ${colorClass}`} />
        );
        switch (rating) {
            case '--':
                return [ball('bg-red-500', 0), ball('bg-red-500', 1)];
            case '-':
                return [ball('bg-red-500', 0)];
            case '0':
                return [ball('bg-gray-400', 0)];
            case '+':
                return [ball('bg-green-500', 0)];
            case '++':
                return [ball('bg-green-500', 0), ball('bg-green-500', 1)];
            default:
                return [];
        }
    };

    // Helper to map session status to color-coded badge classes
    const getStatusClassName = (status: string) => {
        if (!status) return "bg-gray-100 text-gray-800";
        switch (status.toLowerCase()) {
            case "approved":
            case "accepted":
            case "confirmed":
                return "bg-green-100 text-green-800";
            case "pending":
            case "submitted":
                return "bg-blue-100 text-blue-800";
            case "rejected":
            case "declined":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="mb-4 flex justify-between items-center">
                <div>
                    {prevId ? (
                        <Link prefetch="intent" to={`/submissions/${prevId}?year=${year}`} className="text-blue-600 hover:underline">
                            &larr;
                        </Link>
                    ) : <span />}
                </div>
                <div>
                    <Link prefetch="intent" to={`/submissions?year=${year}`} className="text-blue-600 hover:underline">
                        Back to JavaZone {year} sessions
                    </Link>
                </div>
                <div>
                    {nextId ? (
                        <Link prefetch="intent" to={`/submissions/${nextId}?year=${year}`} className="text-blue-600 hover:underline">
                            &rarr;
                        </Link>
                    ) : <span />}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Main Content */}
                <div className="bg-white rounded-lg shadow-md p-6 md:col-span-3">
                    <div className="mb-4">
                        {/* Title & Year */}
                        <div className="flex justify-between items-start mb-2 min-h-20">
                            <h1 className="text-3xl font-bold">{title}</h1>
                            
                        </div>
                        {/* Session metadata & tags */}
                        <div className="flex flex-col gap-2 text-sm text-gray-600">
                            {/* First row: basic metadata */}
                            <div className="flex flex-wrap gap-4">
                                {format && <div className="flex-1 min-w-[150px]"><span className="font-semibold">Format:</span> {format}</div>}
                                {language && <div className="flex-1 min-w-[150px]"><span className="font-semibold">Language:</span> {language}</div>}
                                {length && <div className="flex-1 min-w-[150px]"><span className="font-semibold">Length:</span> {length} minutes</div>}
                            </div>
                            {/* Second row: tags */}
                            {tagsWithAuthor.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {tagsWithAuthor.map((entry, i) => {
                                        const tagClass = deniedTags.includes(entry.tag.toLowerCase())
                                            ? 'bg-red-100 text-red-800'
                                            : acceptedTags.includes(entry.tag.toLowerCase())
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800';
                                        return (
                                            <span key={i} className={`px-2 py-1 text-xs font-medium rounded ${tagClass}`}>{entry.tag}</span>
                                        );
                                    })}
                                </div>
                            )}
                            {/* Third row: room and times */}
                            <div className="flex flex-col gap-2">
                                {room && <div><span className="font-semibold">Room:</span> {room}</div>}
                                {(startTime || endTime) && (
                                    <div className="flex flex-col gap-1">
                                        {startTime && <div><span className="font-semibold">Start Time:</span> {formatDateTime(startTime)}</div>}
                                        {endTime && <div><span className="font-semibold">End Time:</span> {formatDateTime(endTime)}</div>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="border border-gray-200 rounded-lg shadow p-6 mb-6 divide-y divide-gray-200">
                        {abstract && (
                            <div className="py-4">
                                <h2 className="text-xl font-semibold mb-2">Abstract</h2>
                                <p className="whitespace-pre-line">{abstract}</p>
                            </div>
                        )}
                        {data.outline?.value && (
                            <div className="py-4">
                                <h2 className="text-xl font-semibold mb-2">Outline</h2>
                                <p className="whitespace-pre-line">{data.outline.value}</p>
                            </div>
                        )}
                        {data.infoToProgramCommittee?.value && (
                            <div className="py-4">
                                <h2 className="text-xl font-semibold mb-2">Info To Program Committee</h2>
                                <p className="whitespace-pre-line">{data.infoToProgramCommittee.value}</p>
                            </div>
                        )}
                    </div>

                    {/* Speakers Card */}
                    {talk.speakers && talk.speakers.length > 0 && (
                        <div className="border border-gray-200 rounded-lg shadow p-6 mb-6">
                            <h2 className="text-xl font-semibold mb-4">Speakers</h2>
                            <div className="space-y-4">
                                {talk.speakers.map((speaker, idx) => {
                                    const currentList = otherTalksBySpeaker[speaker.email]?.currentYear || [];
                                    const otherList = otherTalksBySpeaker[speaker.email]?.other || [];
                                    const groupedCurrent = currentList.reduce((acc: Record<string, typeof currentList>, t) => {
                                        if (!acc[t.year]) acc[t.year] = [];
                                        acc[t.year].push(t);
                                        return acc;
                                    }, {});
                                    const groupedOther = otherList.reduce((acc: Record<string, typeof otherList>, t) => {
                                        if (!acc[t.year]) acc[t.year] = [];
                                        acc[t.year].push(t);
                                        return acc;
                                    }, {});
                                    return (
                                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-lg font-medium mb-2">{speaker.name}</h3>
                                        <div className="divide-y divide-gray-200">
                                            {speaker.data?.bio?.value && (
                                                <div className="py-2 whitespace-pre-line">{speaker.data.bio.value}</div>
                                            )}
                                            {speaker.email && (
                                                <div className="py-2"><span className="font-semibold">Email:</span> {speaker.email}</div>
                                            )}
                                            {speaker.data.residence?.value && (
                                                <div className="py-2"><span className="font-semibold">Residence:</span> {speaker.data.residence.value}</div>
                                            )}
                                            {speaker.data?.twitter?.value && (
                                                <div className="py-2">
                                                    <a href={`https://twitter.com/${speaker.data.twitter.value}`} className="text-blue-600 hover:underline">
                                                        Twitter: @{speaker.data.twitter.value}
                                                    </a>
                                                </div>
                                            )}
                                            {/* Current Year Talks */}
                                            {Object.keys(groupedCurrent).length > 0 && (
                                                <div className="py-2">
                                                    <h4 className="text-md font-semibold mb-1">Current Year Talks</h4>
                                                    {Object.entries(groupedCurrent).map(([yearKey, talks]) => (
                                                        <div key={yearKey} className="mb-2">
                                                            <div className="text-sm font-medium text-gray-700">{yearKey}</div>
                                                            <ul className="list-disc list-inside">
                                                                {talks.map((t, j) => (
                                                                    <li key={j} className="flex items-center space-x-2">
                                                                        <Link to={`/submissions/${t.id}?year=${t.year}`} className="text-blue-600 hover:underline">
                                                                            {t.data.title.value}
                                                                        </Link>
                                                                        {t.status && (
                                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusClassName(t.status)}`}>
                                                                                {t.status}
                                                                            </span>
                                                                        )}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Other Talks */}
                                            {Object.keys(groupedOther).length > 0 && (
                                                <div className="py-2">
                                                    <h4 className="text-md font-semibold mb-1">Other Talks</h4>
                                                    {Object.entries(groupedOther).map(([yearKey, talks]) => (
                                                        <div key={yearKey} className="mb-2">
                                                            <div className="text-sm font-medium text-gray-700">{yearKey}</div>
                                                            <ul className="list-disc list-inside">
                                                                {talks.map((t, j) => (
                                                                    <li key={j} className="flex items-center space-x-2">
                                                                        <Link to={`/submissions/${t.id}?year=${t.year}`} className="text-blue-600 hover:underline">
                                                                            {t.data.title.value}
                                                                        </Link>
                                                                        {t.status && (
                                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusClassName(t.status)}`}>
                                                                                {t.status}
                                                                            </span>
                                                                        )}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Misc Card */}
                    <div className="border border-gray-200 rounded-lg shadow p-6 mb-6 divide-y divide-gray-200">
                        <div>
                            {intendedAudience && (
                                <div className="py-4">
                                    <h3 className="text-lg font-semibold mb-1">Intended Audience</h3>
                                    <p>{intendedAudience}</p>
                                </div>
                            )}
                            <div className="py-4"><h3 className="text-lg font-semibold mb-1">Suggested Keywords</h3><p>{data.suggestedKeywords?.value || 'N/A'}</p></div>
                            <div className="py-4"><h3 className="text-lg font-semibold mb-1">Equipment</h3><p>{data.equipment?.value || 'N/A'}</p></div>
                            <div className="py-4"><h3 className="text-lg font-semibold mb-1">Participation</h3><p>{data.participation?.value || 'N/A'}</p></div>
                            <div className="py-4"><h3 className="text-lg font-semibold mb-1">Video</h3><p>{data.video?.value || 'N/A'}</p></div>
                            <div className="py-4"><h3 className="text-lg font-semibold mb-1">Tags with Author</h3><ul className="list-disc list-inside">{tagsWithAuthor.length > 0 ? tagsWithAuthor.map((tagEntry, idx) => <li key={idx}>{tagEntry.tag} (by {tagEntry.author})</li>) : <li>No tags with author</li>}</ul></div>
                            <div className="py-4"><h3 className="text-lg font-semibold mb-1">Session Updates</h3><p>Has Unpublished Changes: {talk.sessionUpdates.hasUnpublishedChanges ? 'Yes' : 'No'}</p></div>
                            <div className="py-4"><h3 className="text-lg font-semibold mb-1">Talk Updates</h3><ul className="list-disc list-inside">{talk.talkUpdates.map((update, idx) => <li key={idx}>{update.updatedBy} at {formatDateTime(update.updatedAt)}</li>)}</ul></div>
                            <div className="py-4"><h3 className="text-lg font-semibold mb-1">Posted By</h3><p>{talk.postedBy}</p></div>
                            <div className="py-4"><h3 className="text-lg font-semibold mb-1">Last Updated</h3><p>{formatDateTime(talk.lastUpdated)}</p></div>
                        </div>
                    </div>
                </div>
                {/* Sidebar with Program Committee Feedback */}
                <aside className="bg-white rounded-lg shadow-md p-6 md:col-span-1">
                    <h2 className="text-xl font-semibold mb-4">Program Committee Feedback</h2>
                    {/* Feedback Comments */}
                    {commentFeedbacks.length > 0 && (
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-1">Comments</h3>
                            <ul className="space-y-4 text-sm">
                                {commentFeedbacks.map(fb => (
                                    <li key={fb.id} className="border-b pb-2">
                                        <div className="font-medium">{fb.author}</div>
                                        <p className="whitespace-pre-line">{fb.info}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {/* Rating Spectrum and Details */}
                    {ratingFeedbacks.length > 0 && (
                        <>
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold mb-1">Rating Spectrum</h3>
                                <div className="relative w-full h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full mb-1">
                                    <div
                                        className="absolute top-0 w-3 h-3 bg-white border-2 border-gray-300 rounded-full"
                                        style={{ left: `calc(${ratingPosition}% - 0.375rem)` }}
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold mb-1">Ratings Detail</h3>
                                <ul className="space-y-4 text-sm">
                                    {ratingFeedbacks.map((fb, idx) => (
                                        <li key={idx} className="border-b pb-2">
                                            <div className="font-medium">{fb.author}</div>
                                            <div className="flex items-center space-x-1">
                                                {getRatingBalls(fb.info)}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}
                    {commentFeedbacks.length === 0 && ratingFeedbacks.length === 0 && (
                        <p className="text-sm text-gray-600">No feedback yet.</p>
                    )}
                </aside>
            </div>
        </div>
    );
}