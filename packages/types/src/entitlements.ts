export type Plan = 'free' | 'pro' | 'business';

export type Entitlements = {
  label: string;
  maxProjects: number;
  maxTablesPerProject: number;
  maxGuestsPerProject: number;
  realtimeCollab: boolean;        // Step 15 才会启用
  watermark: boolean;             // Free 显示水印
};

export const ENTITLEMENTS: Record<Plan, Entitlements> = {
  free: {
    label: 'Free',
    maxProjects: 2,
    maxTablesPerProject: 6,
    maxGuestsPerProject: 60,
    realtimeCollab: false,
    watermark: true
  },
  pro: {
    label: 'Pro',
    maxProjects: 50,
    maxTablesPerProject: 50,
    maxGuestsPerProject: 2000,
    realtimeCollab: true,
    watermark: false
  },
  business: {
    // 先与 Pro 一致；后续可单独放大
    label: 'Business',
    maxProjects: 200,
    maxTablesPerProject: 200,
    maxGuestsPerProject: 10000,
    realtimeCollab: true,
    watermark: false
  }
};
