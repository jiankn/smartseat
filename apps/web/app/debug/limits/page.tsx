'use client';
import { useEffect, useState } from 'react';
import { apiGet } from '@smartseat/utils';

type Result = {
  plan: 'free' | 'pro' | 'business';
  entitlements: {
    label: string;
    maxProjects: number;
    maxTablesPerProject: number;
    maxGuestsPerProject: number;
    realtimeCollab: boolean;
    watermark: boolean;
  };
  usage: {
    projects: number;
    byProject: { projectId: string; tables: number; guests: number }[];
  };
};

export default function Page() {
  const [data, setData] = useState<Result | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Result>('/api/entitlements').then(setData).catch((e:any)=>setMsg(e.message ?? 'failed'));
  }, []);

  if (msg) return <div className="text-red-300">{msg}</div>;
  if (!data) return <div>加载中…</div>;

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Entitlements</h2>
      <div className="rounded bg-white/5 p-3">
        <div>Plan: <b>{data.plan}</b> ({data.entitlements.label})</div>
        <div>Max Projects: {data.entitlements.maxProjects}</div>
        <div>Max Tables / Project: {data.entitlements.maxTablesPerProject}</div>
        <div>Max Guests / Project: {data.entitlements.maxGuestsPerProject}</div>
        <div>Realtime Collab: {String(data.entitlements.realtimeCollab)}</div>
        <div>Watermark: {String(data.entitlements.watermark)}</div>
      </div>
      <div className="rounded bg-white/5 p-3">
        <div className="font-medium mb-2">Usage</div>
        <div>Projects: {data.usage.projects}</div>
        <ul className="mt-2 space-y-1">
          {data.usage.byProject.map(x=>(
            <li key={x.projectId} className="text-sm opacity-80">
              {x.projectId.slice(0,8)}… — tables: {x.tables}, guests: {x.guests}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
