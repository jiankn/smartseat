'use client';
import { useState } from 'react';
import { apiGet, apiPost } from '@smartseat/utils';

export default function DebugApi() {
  const [out, setOut] = useState<any>(null);

  async function run<T>(fn: () => Promise<T>) {
    try {
      const data = await fn();
      setOut(data);
    } catch (e: any) {
      setOut({ error: e.code ?? 'ERR', message: e.message });
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Debug: API helpers</h2>
      <div className="flex gap-2">
        <button className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" onClick={() => run(() => apiGet('/api/echo'))}>
          GET /api/echo
        </button>
        <button className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" onClick={() => run(() => apiGet('/api/echo?fail=1'))}>
          GET fail
        </button>
        <button className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" onClick={() => run(() => apiPost('/api/echo', { name: 'Alice' }))}>
          POST ok
        </button>
        <button className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" onClick={() => run(() => apiPost('/api/echo', {}))}>
          POST validation fail
        </button>
      </div>
      <pre className="bg-black/40 rounded p-3 overflow-auto">{JSON.stringify(out, null, 2)}</pre>
    </div>
  );
}
