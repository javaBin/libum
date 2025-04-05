import { useLoaderData } from "@remix-run/react";
import {LoaderFunction} from "@remix-run/node";

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
    tags: SocialMediaData[];
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


export const loader: LoaderFunction = async ({ params }) => {

    const slug = params.slug;
    const basicAuth = Buffer.from(process.env.MORESLEEP_BASIC_AUTH ?? "").toString("base64");

    console.log({basicAuth})

    const response = await fetch(`https://sleepingpill.javazone.no/data/session/${slug}`, {
        headers: {
            "Authorization": `Basic ${basicAuth}`,
            "Accept": "application/json"
        }
    })
    const session = await response.json() as InternalSession

    // You can fetch data based on slug here
    return session
};

export default function Slug() {
    const session = useLoaderData<typeof loader>() as InternalSession
    return (
        <div>
            <h1>{session.data.title.value}</h1>
        </div>
    );
}
