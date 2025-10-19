'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPost } from '@smartseat/utils';

type Project = { id: string; name: string; createdAt: string };

export default function ProjectsPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    try {
      const data = await apiGet<Project[]>('/api/projects');
      setItems(data);
    } catch (e: any) {
      setMsg(e.message ?? 'failed');
    }
  }

  useEffect(() => { load(); }, []);

  async function create() {
    setMsg(null);
    if (!name.trim()) return setMsg('请输入项目名');
    try {
      await apiPost<Project>('/api/projects', { name });
      setName('');
      await load();
    } catch (e: any) { setMsg(e.message ?? 'failed'); }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">我的项目</h1>

      <div className="flex gap-2">
        <input
          className="rounded bg-white/10 px-3 py-2 outline-none"
          placeholder="新项目名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="px-3 py-2 rounded bg-white/10 hover:bg-white/20" onClick={create}>
          创建
        </button>
      </div>
      {msg && <div className="text-red-300 text-sm">{msg}</div>}

      <ul className="space-y-2">
        {items.map(p => (
          <li key={p.id} className="bg-white/5 rounded p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="opacity-60 text-sm">{new Date(p.createdAt).toLocaleString()}</div>
            </div>
            <Link className="underline" href={`/projects/${p.id}`}>详情</Link>
          </li>
        ))}
        {items.length === 0 && <li className="opacity-60">暂无项目</li>}
      </ul>
    </div>
  );
}
