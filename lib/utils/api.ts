/**
 * Utility functions for making authenticated API calls
 */

/**
 * Make an authenticated fetch request with Authorization header
 * @param url - The API endpoint URL
 * @param getAuthToken - Function to get the authentication token
 * @param options - Fetch options (method, body, etc.)
 * @returns Response from fetch
 */
export async function authenticatedFetch(
  url: string,
  getAuthToken: () => Promise<string | null>,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header if token exists (production mode)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Merge with existing headers from options
  if (options.headers) {
    const existingHeaders = new Headers(options.headers);
    existingHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

