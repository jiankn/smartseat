'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, apiPost } from '@smartseat/utils';

type GuestRow = { id: string; fullName: string; email?: string | null; phone?: string | null; group?: string | null; tags: string[] };

export default function GuestsPage() {
  const { id } = useParams<{ id: string }>();
  const [rows, setRows] = useState<GuestRow[]>([]);
  const [fullName, setFullName] = useState('');
  const [group, setGroup] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    try { setRows(await apiGet<GuestRow[]>(`/api/projects/${id}/guests`)); }
    catch (e: any) { setMsg(e.message ?? 'failed'); }
  }
  useEffect(() => { load(); }, [id]);

  async function create() {
    setMsg(null);
    try {
      await apiPost(`/api/projects/${id}/guests`, { fullName, group: group || undefined });
      setFullName(''); setGroup('');
      await load();
    } catch (e: any) { setMsg(e.message ?? 'failed'); }
  }

  async function rename(gid: string) {
    const v = prompt('姓名');
    if (!v) return;
    await fetch(`/api/projects/${id}/guests/${gid}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fullName: v }) });
    await load();
  }
  async function changeGroup(gid: string) {
    const v = prompt('分组（留空=清除）', '');
    const body = v ? { group: v } : { group: null };
    await fetch(`/api/projects/${id}/guests/${gid}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    await load();
  }
  async function remove(gid: string) {
    if (!confirm('删除该来宾？')) return;
    await fetch(`/api/projects/${id}/guests/${gid}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">来宾管理</h1>

      <div className="flex flex-wrap gap-2 items-center">
        <input className="rounded bg-white/10 px-3 py-2 outline-none" placeholder="姓名" value={fullName} onChange={e => setFullName(e.target.value)} />
        <input className="rounded bg-white/10 px-3 py-2 outline-none" placeholder="分组(可选)" value={group} onChange={e => setGroup(e.target.value)} />
        <button className="px-3 py-2 rounded bg-white/10 hover:bg-white/20" onClick={create}>新增</button>
      </div>
      {msg && <div className="text-red-300 text-sm">{msg}</div>}

      <ul className="space-y-2">
        {rows.map(r => (
          <li key={r.id} className="bg-white/5 rounded p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">{r.fullName}</div>
              <div className="opacity-60 text-sm">分组：{r.group ?? '-'}</div>
              {r.tags?.length ? <div className="opacity-60 text-sm">标签：{r.tags.join(', ')}</div> : null}
            </div>
            <div className="flex gap-2">
              <button className="px-2 py-1 rounded bg-white/10" onClick={() => rename(r.id)}>重命名</button>
              <button className="px-2 py-1 rounded bg-white/10" onClick={() => changeGroup(r.id)}>分组</button>
              <button className="px-2 py-1 rounded bg-red-600/30 hover:bg-red-600/40" onClick={() => remove(r.id)}>删除</button>
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="opacity-60">暂无来宾</li>}
      </ul>
    </div>
  );
}
