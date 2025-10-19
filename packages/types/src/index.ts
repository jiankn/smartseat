// ---------- 基础枚举 ----------
export type Plan = 'free' | 'pro' | 'business';
export type PaperSize = 'A4' | 'Letter';
export type TableShape = 'round' | 'rect';
export type ShareRole = 'viewer' | 'commenter';

export type QuotaKey = 'AI_GENERATE' | 'AI_DIFF' | 'EXPORT_PDF' | 'SHARE_LINK_CREATE';

// 资源锁键命名约定（必须遵守）
export type LockResourceKey =
  | `table:${string}`
  | `seat:${string}:${number}` // tableId, seatNo
  | `guest:${string}`;

// ---------- 错误与通用响应 ----------
export interface ApiError {
  code: string;                 // e.g. AUTH_REQUIRED / QUOTA_EXCEEDED / CONFLICT_LOCKED
  message: string;
  details?: unknown;
}
export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: ApiError };

// ---------- 约束模型（前后端共享） ----------
export type Constraint =
  | { type: 'SAME_TABLE'; hard: boolean; weight: number; members: string[] }
  | { type: 'AVOID_SAME_TABLE'; hard: boolean; weight: number; pairs: [string, string][] }
  | { type: 'TABLE_CAPACITY'; hard: true; weight: 10 }
  | { type: 'VIP_FRONT'; hard: boolean; weight: number; guests: string[]; priorityZone: string }
  | { type: 'GROUP_TOGETHER'; hard: boolean; weight: number; group: string }
  | { type: 'DISTRIBUTE_GROUP'; hard: boolean; weight: number; group: string; minPerTable?: number }
  | { type: 'LOCK_SEAT'; hard: true; weight: 10; assignments: { guestId: string; tableId: string; seatNo: number }[] }
  | { type: 'ZONE_PREFERENCE'; hard: boolean; weight: number; guest: string; zones: string[] }
  | { type: 'MAX_DISTANCE'; hard: boolean; weight: number; max: number };

// ---------- 排座 DTO ----------
export interface GenerateRequest {
  strategy: 'heuristic-v1';
  respectLocks: boolean;
  maxIterations: number;     // default 3000
  timeBudgetMs: number;      // default 500
}
export interface Violation { type: string; count: number }
export interface GenerateSummary {
  hardSatisfied: boolean;
  softScore: number;         // 0..1
  violations: Violation[];
}
export interface GenerateResponse {
  jobId: string;
  summary?: GenerateSummary; // 任务完成后返回
}

export interface DiffRequest {
  changes: Array<
    | { kind: 'ADD_GUEST'; guestId: string }
    | { kind: 'REMOVE_GUEST'; guestId: string }
    | { kind: 'TABLE_CAPACITY'; tableId: string; capacity: number }
    | { kind: 'CONSTRAINT_UPDATE'; constraintId: string }
  >;
  respectLocks: boolean;
}
export interface DiffResponse {
  affectedTables: string[];
  affectedGuests: string[];
  summary: GenerateSummary;
}

// ---------- Presence / 协作 ----------
export interface PresencePayload {
  userId: string;
  displayName: string;
  color: string;
  selection?: { tableId?: string; guestId?: string };
}
export type PresenceEvent = 'presence.join' | 'presence.leave' | 'selection.update';

// ---------- 计划权益（v1，向后兼容保留；常量名改为 PLAN_ENTITLEMENTS 避免冲突） ----------
export interface PlanEntitlements {
  maxProjects: number | 'unlimited';
  maxGuestsPerProject?: number;
  aiQuotaPerMonth: number;
  watermark: boolean;
  commentEnabled: boolean;
  snapshotRetentionDays?: number;
}
export const PLAN_ENTITLEMENTS: Record<Plan, PlanEntitlements> = {
  free:      { maxProjects: 1,   maxGuestsPerProject: 150,  aiQuotaPerMonth: 3,    watermark: true,  commentEnabled: false, snapshotRetentionDays: 0 },
  pro:       { maxProjects: 20,  aiQuotaPerMonth: 200,      watermark: false,      commentEnabled: true,  snapshotRetentionDays: 30 },
  business:  { maxProjects: 'unlimited', aiQuotaPerMonth: 2000, watermark: false,  commentEnabled: true,  snapshotRetentionDays: 90 },
};

// ---------- 路由常量 ----------
export const Routes = {
  Auth: { SignIn: '/auth/signin', Profile: '/settings/profile' },
  Org:  { Settings: '/settings/org' },
  Projects: { List: '/projects', Create: '/projects/new', Detail: (id: string) => `/projects/${id}` },
  Billing: { Pricing: '/pricing', Checkout: '/api/billing/checkout', Portal: '/api/billing/portal' }
} as const;

// ---------- v2 套餐与额度（Step 08 使用的统一导出） ----------
export { ENTITLEMENTS } from './entitlements';
export type { Entitlements } from './entitlements';
