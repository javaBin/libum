import { Form, useSubmit, useNavigate, Link } from "@remix-run/react";
import { useSubmissionsContext } from "./submissions";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import type { Session as ContextSession } from "./submissions";

export default function Index() {
    const { sessions, selectedYear, availableConferences, isFutureYear, filters, setFilters } = useSubmissionsContext();
    const submit = useSubmit();
    
    // When year changes, submit the form to reload data
    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        submit(e.currentTarget.form);
    };
    
    // Format the session start time
    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('no-NO', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            }).format(date);
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <div className="flex items-center space-x-2 mb-4">
                        <img src="/logo-sharp.svg" alt="JavaZone Logo" className="h-10 w-auto" />
                        <h1 className="text-3xl font-bold">JavaZone Sessions</h1>
                    </div>
                    <Link
                        to="/"
                        className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors inline-block"
                    >
                        Back to Home
                    </Link>
                </div>
                
                <Form method="get" className="flex items-center space-x-4">
                    <div>
                        <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                            Select Conference:
                        </label>
                        <select
                            id="year"
                            name="year"
                            value={selectedYear}
                            onChange={handleYearChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        >
                            {availableConferences.map((conference: any) => (
                                <option key={conference.id} value={conference.year}>
                                    {conference.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </Form>
            </div>
            
            {/* Render table from cached context */}
            <SessionsTable />
        </div>
    );
}

function SessionRow({session, selectedYear}: {session: ContextSession; selectedYear: string }) {
    const navigate = useNavigate();
    // Tag color categories and sorted tags
    const deniedTags = ['nei','no',"rejected"];
    const acceptedTags = ['accepted','confirmed','ja','ai','arch','bankers','core','data','devex','duplikat','exp','front','infra','lang','lightning','misc','ops','popcorn','proc','qa','sec'];
    // Sort tags: numeric 4-digit tags last
    const numericRe = /^\d{4}$/;
    const sortedTags = [...session.tags].sort((a, b) => {
      const aNum = numericRe.test(a);
      const bNum = numericRe.test(b);
      if (aNum && !bNum) return 1;
      if (!aNum && bNum) return -1;
      return a.localeCompare(b);
    });
  
    const getStatusClassName = (status?: string) => {
        if (!status) return "bg-gray-100 text-gray-800";
        
        switch(status.toLowerCase()) {
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
        <TableRow
            role="button"
            onClick={() => navigate(`/submissions/${session.id}?year=${selectedYear}`)}
            className="cursor-pointer hover:bg-gray-50"
        >
            <TableCell className="font-medium">
                <Link 
                    to={`/submissions/${session.id}?year=${selectedYear}`}
                    className="text-blue-600 hover:underline"
                >
                    {session.title}
                </Link>
            </TableCell>
            <TableCell>{session.speakers?.map((speaker: any) => speaker.name).join(", ") || "No speakers listed"}</TableCell>
            <TableCell>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {session.format} ({session.length} min)
                </span>
            </TableCell>
            <TableCell>
                <div className="flex flex-wrap gap-1">
                    {sortedTags.map((tag: any, idx: number) => {
                        const lower = tag.toLowerCase();
                        const bgClass = deniedTags.includes(lower)
                            ? 'bg-red-100 text-red-800'
                            : acceptedTags.includes(lower)
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800';
                        return <span key={idx} className={`px-2 py-0.5 rounded text-xs font-medium ${bgClass}`}>{tag}</span>;
                    })}
                </div>
            </TableCell>
            <TableCell>
                {session.status && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClassName(session.status)}`}>
                        {session.status}
                    </span>
                )}
            </TableCell>
        </TableRow>
    );
}

// Component to render sessions with filters and colored tags
function SessionsTable() {
    const { sessions, selectedYear, isFutureYear, error, filters, setFilters } = useSubmissionsContext();
    const { title: titleFilter, author: authorFilter, format: formatFilter, tag: tagFilter, status: statusFilter } = filters;
    const deniedTags = ['nei', 'no'];
    const acceptedTags = ['ai','arch','bankers','core','data','devex','duplikat','exp','front','infra','lang','lightning','misc','ops','popcorn','proc','qa','sec'];
    const formatOptions = Array.from(new Set(sessions.map(s => s.format)));
    const statusOptions = Array.from(new Set(sessions.map(s => s.status || '')));
    const tagOptions = Array.from(new Set(sessions.flatMap(s => s.tags)));
    // Sort tags: non-numeric (4 digits) alphabetically first, numeric 4-digit tags last
    tagOptions.sort((a, b) => {
      const numericRe = /^\d{4}$/;
      const aNum = numericRe.test(a);
      const bNum = numericRe.test(b);
      if (aNum && !bNum) return 1;
      if (!aNum && bNum) return -1;
      return a.localeCompare(b);
    });
    const filtered = sessions.filter(s => {
        if (titleFilter && !s.title.toLowerCase().includes(titleFilter.toLowerCase())) return false;
        if (authorFilter && !s.speakers.some(sp => sp.name.toLowerCase().includes(authorFilter.toLowerCase()))) return false;
        if (formatFilter && s.format !== formatFilter) return false;
        if (tagFilter && !s.tags.includes(tagFilter)) return false;
        if (statusFilter && s.status !== statusFilter) return false;
        return true;
    });

    // Display error message if one exists
    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                        <p className="text-sm text-red-700 mt-2">
                            This might be due to an authentication issue. Please check that your environment 
                            variables are correctly set and that the API is available.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    if (sessions.length === 0) {
        return (
            <div className={`${isFutureYear ? 'bg-blue-50 border-blue-400' : 'bg-yellow-50 border-yellow-400'} border-l-4 p-4 mb-4`}>
                <div className="flex">
                    <div className="ml-3">
                        <p className={`text-sm ${isFutureYear ? 'text-blue-700' : 'text-yellow-700'}`}>{
                            isFutureYear
                                ? `JavaZone ${selectedYear} has not happened yet. Sessions will be available closer to the event.`
                                : `No sessions found for ${selectedYear}.`
                        }</p>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableCaption>List of {filtered.length} sessions from JavaZone {selectedYear}</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[30%] pl-1">
                            <input
                                type="text"
                                placeholder="Filter title..."
                                value={titleFilter}
                                onChange={e => setFilters(f => ({ ...f, title: e.target.value }))}
                                className="w-full border p-2 rounded"
                            />
                        </TableHead>
                        <TableHead className="w-[20%] pl-1">
                            <input
                                type="text"
                                placeholder="Filter speaker..."
                                value={authorFilter}
                                onChange={e => setFilters(f => ({ ...f, author: e.target.value }))}
                                className="w-full border p-2 rounded"
                            />
                        </TableHead>
                        <TableHead className="w-[15%] pl-1">
                            <select
                                value={formatFilter}
                                onChange={e => setFilters(f => ({ ...f, format: e.target.value }))}
                                className="w-full border p-2 rounded"
                            >
                                <option value="">All</option>
                                {formatOptions.map((opt: any) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </TableHead>
                        <TableHead className="w-[15%] pl-1">
                            <select
                                value={tagFilter}
                                onChange={e => setFilters(f => ({ ...f, tag: e.target.value }))}
                                className="w-full border p-2 rounded"
                            >
                                <option value="">All</option>
                                {tagOptions.map((opt: any) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </TableHead>
                        <TableHead className="w-[10%] pl-1">
                            <select
                                value={statusFilter}
                                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                                className="w-full border p-2 rounded"
                            >
                                <option value="">All</option>
                                {statusOptions.map((opt: any) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </TableHead>
                    </TableRow>
                    <TableRow>
                        <TableHead className="w-[30%]">Title</TableHead>
                        <TableHead className="w-[20%]">Speakers</TableHead>
                        <TableHead className="w-[15%]">Format</TableHead>
                        <TableHead className="w-[15%]">Tags</TableHead>
                        <TableHead className="w-[10%]">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filtered.map((session: ContextSession) => (
                        <SessionRow key={session.id} session={session} selectedYear={selectedYear} />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}