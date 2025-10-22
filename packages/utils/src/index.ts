import type { ApiResponse, ApiError } from '@smartseat/types';

// ---------- Server helpers ----------
export function ok<T>(data: T, init?: ResponseInit): Response {
  const body: ApiResponse<T> = { ok: true, data };
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) }
  });
}

export function err(code: string, message: string, status = 400, details?: unknown): Response {
  const error: ApiError = { code, message, details };
  const body: ApiResponse<never> = { ok: false, error };
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

// ---------- Client helpers ----------
export async function parseApi<T>(res: Response): Promise<T> {
  const raw = await res.text();
  if (!raw) {
    if (res.ok) {
      return undefined as T;
    }
    throw Object.assign(new Error('EMPTY_RESPONSE'), {
      code: 'EMPTY_RESPONSE',
      status: res.status
    });
  }

  let parsed: ApiResponse<T>;
  try {
    parsed = JSON.parse(raw) as ApiResponse<T>;
  } catch (err) {
    const snippet = raw.length > 200 ? `${raw.slice(0, 200)}…` : raw;
    throw Object.assign(new Error('INVALID_JSON_RESPONSE'), {
      code: 'INVALID_JSON',
      status: res.status,
      details: snippet
    });
  }

  if ((parsed as any).ok) return (parsed as any).data as T;

  const e = (parsed as any).error as ApiError | undefined;
  throw Object.assign(new Error(e?.message ?? 'API_ERROR'), {
    code: e?.code ?? 'API_ERROR',
    details: e?.details,
    status: res.status
  });
}

export async function apiGet<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, method: 'GET' });
  return parseApi<T>(res);
}

export async function apiPost<T>(url: string, body?: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return parseApi<T>(res);
}

// Utility
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- Entitlements & Quota ----------
export async function getOrgPlan(prisma: any, orgId: string): Promise<'free' | 'pro' | 'business'> {
  const subscription = await prisma.subscription.findUnique({ where: { orgId } });
  return subscription?.plan ?? 'free';
}

export function getEntitlements(plan: 'free' | 'pro' | 'business'): {
  maxProjects: number | 'unlimited';
  maxGuestsPerProject?: number;
  maxTablesPerProject?: number;
  aiQuotaPerMonth: number;
  watermark: boolean;
  commentEnabled: boolean;
  snapshotRetentionDays?: number;
} {
  const entitlements = {
    free: { maxProjects: 1, maxGuestsPerProject: 150, maxTablesPerProject: 10, aiQuotaPerMonth: 3, watermark: true, commentEnabled: false, snapshotRetentionDays: 0 },
    pro: { maxProjects: 20, maxTablesPerProject: 50, aiQuotaPerMonth: 200, watermark: false, commentEnabled: true, snapshotRetentionDays: 30 },
    business: { maxProjects: Infinity, aiQuotaPerMonth: 2000, watermark: false, commentEnabled: true, snapshotRetentionDays: 90 }
  };
  return entitlements[plan] || entitlements.free;
}
