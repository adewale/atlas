/**
 * Atlas search Worker — entry point.
 *
 * Routes GET /api/search to the hybrid search handler.
 * All other methods/paths return 404.
 */
import { handleSearch, type SearchEnv } from './handler';

export default {
  async fetch(request: Request, env: SearchEnv): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/search') {
      const response = await handleSearch(url.searchParams, env);
      return new Response(JSON.stringify(response), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
