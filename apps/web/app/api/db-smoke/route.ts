export const runtime = 'nodejs';

import prisma from '@smartseat/db';
import { type ApiResponse } from '@smartseat/types';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    const [projects, tables, guests] = await Promise.all([
      prisma.project.count(),
      prisma.table.count(),
      prisma.guest.count()
    ]);
    const body: ApiResponse<{ projects: number; tables: number; guests: number }> = {
      ok: true,
      data: { projects, tables, guests }
    };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    const body: ApiResponse<never> = { ok: false, error: { code: 'DB_ERROR', message: e?.message ?? 'unknown' } };
    return new Response(JSON.stringify(body), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
