import {useLoaderData} from "react-router";

type Speaker = {
    name: string;
    twitter: string;
    bio: string;
};

type Session = {
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
    speakers: Speaker[];
};

type Submissions = {
    sessions: Session[]
}


export async function loader() {
    const response = await fetch("https://sleepingpill.javazone.no/public/allSessions/javazone_2023", {
        headers: {
            "Accept": "application/json"
        }
    })

    const submissions = await response.json() as Submissions

    return Response.json(submissions.sessions)
}

export default function Index() {
    const sessions = useLoaderData() as Session[]
    console.log(sessions)

    return (
        <>
            <SessionHeader />
            <ul>
                {
                    sessions.map(session => <li key={session.id}><Session title={session.title}
                                                                                      speakers={session.speakers.map(s => s.name)}
                                                                                      category={"FAEN"}/></li>)
                }
            </ul>
        </>
        )
}

function SessionHeader() {
    return <div>HEADER</div>
}

/**
 *
 * Reject - fase 1
 * Revurdering
 * Videre
 * Offered
 * Declined
 * Accepted
 * Rejected - fase 2
 * Trakk seg
 * */

function Session({title, speakers, category}: { title: string, speakers: string[], category: string }) {
    return <div style={{
        margin: "1rem",
        background: "pink",
        color: "chocolate"
    }}>
        <h2 style={{fontWeight: "bold"}}>{title} ({speakers.join(", ")})</h2>
        <p>{category}</p>
        <p>Stage: Initial</p>
    </div>
}