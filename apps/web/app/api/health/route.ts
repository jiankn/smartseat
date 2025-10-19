import { type ApiResponse } from '@smartseat/types';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const data = { uptime: process.uptime(), now: new Date().toISOString() };
  const body: ApiResponse<typeof data> = { ok: true, data };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
}
