import {useLoaderData} from "react-router";

export async function loader() {
    const response = await fetch("https://sleepingpill.javazone.no/public/allSessions/javazone_2023", {
        headers: {
            "Accept": "application/json"
        }
    })

    const submissions = await response.json()

    return Response.json(submissions.sessions)
}

export default function Index() {
    const sessions = useLoaderData()
    console.log(sessions)
    // @ts-ignore

    return (
        <>
            <SessionHeader />
            <ul>
                {
                    sessions.map(session => <li key={session.id}><Session title={session.title}
                                                                                      speakers={session.speakers.map(s => s.name).join(", ")}
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
        <h2 style={{fontWeight: "bold"}}>{title} ({speakers})</h2>
        <p>{category}</p>
        <p>Stage: Initial</p>
    </div>
}