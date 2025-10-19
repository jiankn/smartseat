'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiGet } from '@smartseat/utils';

type Detail = { id: string; name: string; createdAt: string; archived: boolean; tables: { id: string }[]; guests: { id: string }[] };

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<Detail | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function load() {
    try { setD(await apiGet<Detail>(`/api/projects/${id}`)); }
    catch (e: any) { setMsg(e.message ?? 'failed'); }
  }
  useEffect(() => { load(); }, [id]);

  async function rename() {
    const name = prompt('新名称', d?.name ?? '');
    if (!name || !name.trim()) return;
    const res = await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name }) });
    if (res.ok) await load(); else setMsg('重命名失败');
  }
  async function remove() {
    if (!confirm('确认删除？不可恢复')) return;
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/projects'); else setMsg('删除失败');
  }

  if (!d) return <div>加载中… {msg && <span className="text-red-300">{msg}</span>}</div>;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">{d.name}</h1>
      <div className="opacity-60 text-sm">创建于 {new Date(d.createdAt).toLocaleString()}</div>

      <div className="flex gap-2">
        <Link className="px-3 py-2 rounded bg-white/10 hover:bg-white/20" href={`/projects/${id}/tables`}>管理桌子（{d.tables.length}）</Link>
        <Link className="px-3 py-2 rounded bg-white/10 hover:bg-white/20" href={`/projects/${id}/guests`}>管理来宾（{d.guests.length}）</Link>
        <Link className="px-3 py-2 rounded bg-white/10 hover:bg-white/20" href={`/projects/${id}/planner`}>
          排座规划
        </Link>
        <button className="px-3 py-2 rounded bg-white/10 hover:bg-white/20" onClick={rename}>重命名</button>
        <button className="px-3 py-2 rounded bg-red-600/30 hover:bg-red-600/40" onClick={remove}>删除</button>
      </div>

      {msg && <div className="text-red-300 text-sm">{msg}</div>}
    </div>
  );
}
