'use client';
import { ENTITLEMENTS, type Plan } from '@smartseat/types';

export default function DebugTypesPage() {
  const pro = ENTITLEMENTS.pro;
  const free = ENTITLEMENTS.free;
  const examplePlan: Plan = 'pro';

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Debug: @smartseat/types</h2>
      <pre className="bg-black/40 rounded p-3 overflow-auto">
        {JSON.stringify({ examplePlan, pro, free }, null, 2)}
      </pre>
    </div>
  );
}
