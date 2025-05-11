import { LoaderFunction, json } from "@remix-run/node";
import { getConferences, Conference } from '~/api/sessions.server';

/**
 * Route to fetch all available JavaZone conferences (authenticated via API client)
 */
export const loader: LoaderFunction = async () => {
  try {
    // This will now use the cached conferences first
    const conferences: Conference[] = await getConferences();
    return json({ conferences, source: 'authenticated' });
  } catch (error) {
    console.error('Error fetching conferences:', error);
    // Fallback static list
    const fallbackConferences: Conference[] = [
      { id: 'javazone_2025', name: 'JavaZone 2025', slug: 'javazone_2025', year: '2025' },
      { id: 'javazone_2024', name: 'JavaZone 2024', slug: 'javazone_2024', year: '2024' },
      { id: 'javazone_2023', name: 'JavaZone 2023', slug: 'javazone_2023', year: '2023' },
      { id: 'javazone_2022', name: 'JavaZone 2022', slug: 'javazone_2022', year: '2022' }
    ];
    return json({ conferences: fallbackConferences, source: 'fallback' });
  }
}; 