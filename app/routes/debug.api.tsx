import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import ENV from '~/env.server';

export const loader: LoaderFunction = async () => {
  // Get authentication credentials
  const credentials = ENV.MORESLEEP_BASIC_AUTH;
  const isAuthenticated = !!credentials;
  
  const results = {
    isAuthenticated,
    authHeader: credentials ? 
      `Basic ${Buffer.from(credentials).toString("base64")}` : 
      'Not set',
    endpoints: {} as Record<string, any>,
    error: undefined as string | undefined
  };
  
  if (isAuthenticated) {
    try {
      // Test conference endpoint
      const basicAuth = Buffer.from(credentials).toString("base64");
      const conferenceEndpoint = "https://sleepingpill.javazone.no/data/conference";
      
      console.log(`Testing endpoint: ${conferenceEndpoint}`);
      const conferenceResponse = await fetch(conferenceEndpoint, {
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Accept": "application/json"
        }
      });
      
      results.endpoints.conference = {
        status: conferenceResponse.status,
        ok: conferenceResponse.ok,
        statusText: conferenceResponse.statusText
      };
      
      if (conferenceResponse.ok) {
        const conferenceData = await conferenceResponse.json();
        if (Array.isArray(conferenceData)) {
          results.endpoints.conference.data = {
            type: 'array',
            length: conferenceData.length,
            sample: conferenceData.length > 0 ? 
              conferenceData[0] : 
              null
          };
        } else {
          results.endpoints.conference.data = {
            type: typeof conferenceData,
            keys: Object.keys(conferenceData),
            sample: Object.keys(conferenceData).length > 0 ? 
              conferenceData[Object.keys(conferenceData)[0]] : 
              null
          };
        }
      }
      
      // Test specific session endpoint for 2023
      const sessionEndpoint = "https://sleepingpill.javazone.no/data/conference/javazone_2023/session";
      console.log(`Testing endpoint: ${sessionEndpoint}`);
      const sessionResponse = await fetch(sessionEndpoint, {
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Accept": "application/json"
        }
      });
      
      results.endpoints.session2023 = {
        status: sessionResponse.status,
        ok: sessionResponse.ok,
        statusText: sessionResponse.statusText
      };
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        results.endpoints.session2023.data = {
          type: Array.isArray(sessionData) ? 'array' : typeof sessionData,
          length: Array.isArray(sessionData) ? 
            sessionData.length : 
            (sessionData && typeof sessionData === 'object' ? Object.keys(sessionData).length : 0),
          keys: sessionData && typeof sessionData === 'object' ? Object.keys(sessionData) : []
        };
        
        if (Array.isArray(sessionData) && sessionData.length > 0) {
          results.endpoints.session2023.sample = sessionData[0];
        } else if (sessionData && typeof sessionData === 'object') {
          results.endpoints.session2023.structure = sessionData;
        }
      }
    } catch (error) {
      results.error = error instanceof Error ? error.message : String(error);
    }
  }
  
  return json(results);
};

export default function DebugApi() {
  const data = useLoaderData<typeof loader>();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Debug</h1>
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="text-xl font-semibold mb-2">Authentication</h2>
        <div className="mb-2">
          <span className="font-medium">Status:</span> 
          <span className={data.isAuthenticated ? "text-green-700" : "text-red-500"}>
            {data.isAuthenticated ? "Authenticated" : "Not Authenticated"}
          </span>
        </div>
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">API Endpoints</h2>
        <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(data.endpoints, null, 2)}</pre>
      </div>
    </div>
  );
} 