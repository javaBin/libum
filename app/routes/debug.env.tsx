import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import ENV from '~/env.server';

export const loader: LoaderFunction = async () => {
  // Get all environment variables for debugging
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    MORESLEEP_BASIC_AUTH: process.env.MORESLEEP_BASIC_AUTH ? 
      `Set via process.env (length: ${process.env.MORESLEEP_BASIC_AUTH.length}, has colon: ${process.env.MORESLEEP_BASIC_AUTH.includes(':')})` : 
      'Not set via process.env',
    MORESLEEP_BASIC_AUTH_FROM_ENV_UTIL: ENV.MORESLEEP_BASIC_AUTH ?
      `Set via ENV utility (length: ${ENV.MORESLEEP_BASIC_AUTH.length}, has colon: ${ENV.MORESLEEP_BASIC_AUTH.includes(':')})` :
      'Not set via ENV utility',
    // Add other relevant env vars here without exposing sensitive data
    // List of all env var names (not values to avoid leaking secrets)
    ENV_KEYS: Object.keys(process.env).sort()
  };
  
  return json({ envVars });
};

export default function DebugEnv() {
  const { envVars } = useLoaderData<{ envVars: Record<string, any> }>();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Debug</h1>
      <div className="bg-gray-100 p-4 rounded">
        <pre className="whitespace-pre-wrap">{JSON.stringify(envVars, null, 2)}</pre>
      </div>
    </div>
  );
} 