'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, apiPost } from '@smartseat/utils';

type TableRow = { id: string; name: string; shape: 'round' | 'rect'; capacity: number; zone: string | null; locked: boolean };

export default function TablesPage() {
  const { id } = useParams<{ id: string }>();
  const [rows, setRows] = useState<TableRow[]>([]);
  const [name, setName] = useState('');
  const [shape, setShape] = useState<'round' | 'rect'>('round');
  const [capacity, setCapacity] = useState(6);
  const [zone, setZone] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    try { setRows(await apiGet<TableRow[]>(`/api/projects/${id}/tables`)); }
    catch (e: any) { setMsg(e.message ?? 'failed'); }
  }
  useEffect(() => { load(); }, [id]);

  async function create() {
    setMsg(null);
    try {
      await apiPost(`/api/projects/${id}/tables`, { name, shape, capacity, zone: zone || undefined });
      setName(''); setZone('');
      await load();
    } catch (e: any) { setMsg(e.message ?? 'failed'); }
  }

  async function rename(tid: string) {
    const nn = prompt('新名称');
    if (!nn) return;
    await fetch(`/api/projects/${id}/tables/${tid}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: nn }) });
    await load();
  }
  async function changeCap(tid: string) {
    const v = Number(prompt('新容量'));
    if (!Number.isFinite(v)) return;
    await fetch(`/api/projects/${id}/tables/${tid}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ capacity: v }) });
    await load();
  }
  async function toggleLock(tid: string, locked: boolean) {
    await fetch(`/api/projects/${id}/tables/${tid}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ locked: !locked }) });
    await load();
  }
  async function remove(tid: string) {
    if (!confirm('删除该桌？')) return;
    await fetch(`/api/projects/${id}/tables/${tid}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">桌子管理</h1>

      <div className="flex flex-wrap gap-2 items-center">
        <input className="rounded bg-white/10 px-3 py-2 outline-none" placeholder="桌名" value={name} onChange={e => setName(e.target.value)} />
        <select className="rounded bg-white/10 px-3 py-2" value={shape} onChange={e => setShape(e.target.value as any)}>
          <option value="round">圆桌</option>
          <option value="rect">长桌</option>
        </select>
        <input className="rounded bg-white/10 px-3 py-2 outline-none w-24" type="number" min={1} value={capacity} onChange={e => setCapacity(parseInt(e.target.value || '1'))} />
        <input className="rounded bg-white/10 px-3 py-2 outline-none" placeholder="分区(可选)" value={zone} onChange={e => setZone(e.target.value)} />
        <button className="px-3 py-2 rounded bg-white/10 hover:bg-white/20" onClick={create}>新增</button>
      </div>
      {msg && <div className="text-red-300 text-sm">{msg}</div>}

      <ul className="space-y-2">
        {rows.map(r => (
          <li key={r.id} className="bg-white/5 rounded p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">{r.name}（{r.shape}，{r.capacity}人）</div>
              <div className="opacity-60 text-sm">分区：{r.zone ?? '-'}</div>
            </div>
            <div className="flex gap-2">
              <button className="px-2 py-1 rounded bg-white/10" onClick={() => rename(r.id)}>重命名</button>
              <button className="px-2 py-1 rounded bg-white/10" onClick={() => changeCap(r.id)}>容量</button>
              <button className="px-2 py-1 rounded bg-white/10" onClick={() => toggleLock(r.id, r.locked)}>{r.locked ? '解锁' : '上锁'}</button>
              <button className="px-2 py-1 rounded bg-red-600/30 hover:bg-red-600/40" onClick={() => remove(r.id)}>删除</button>
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="opacity-60">暂无桌子</li>}
      </ul>
    </div>
  );
}
