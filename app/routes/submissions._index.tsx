import {useLoaderData} from "react-router";
import {Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow} from "~/components/ui/table";

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

type Submissions_index = {
    sessions: Session[]
}


export async function loader() {
    const response = await fetch("https://sleepingpill.javazone.no/public/allSessions/javazone_2023", {
        headers: {
            "Accept": "application/json"
        }
    })

    const submissions = await response.json() as Submissions_index

    return Response.json(submissions.sessions)
}

export default function Index() {
    const sessions = useLoaderData() as Session[]
    console.log(sessions)

    return (
        <>
            <SessionHeader />
            <Table>
                <TableCaption>A list of your recent invoices.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Tittel</TableHead>
                        <TableHead>Folk</TableHead>
                        <TableHead>status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sessions.map((session) => (
                        <Session key={session.sessionId} session={session} />
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={3}>Total</TableCell>
                        <TableCell className="text-right">$2,500.00</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
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

function Session({session}: {session: Session}) {

    return (
        <TableRow
            key={session.sessionId}
            onClick={() => window.location.href = `/submissions/${session.sessionId}`}
            style={{ cursor: 'pointer' }} // Optional: to indicate it's clickable
        >
            <TableCell className="font-medium">{session.title}</TableCell>
            <TableCell>{session.speakers.map(speaker => speaker.name).join(", ")}</TableCell>
            <TableCell>{"innsendt"}</TableCell>
        </TableRow>
    );

}