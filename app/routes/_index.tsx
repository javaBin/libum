//sleepingpill.javazone.no

import { Link } from "@remix-run/react";

export default function Index() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <p className="text-2xl font-bold">Libum - the roman cake</p>
      <Link
        to="/submissions"
        className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors inline-block"
      >
        View Submissions
      </Link>
    </div>
  );
}
