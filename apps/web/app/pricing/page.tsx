'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

async function post(url: string, body?: any) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();       // 先拿原始文本
  let json: any = null;
  if (text) {
    try { json = JSON.parse(text); }
    catch { throw new Error(`HTTP ${res.status}: ${text.slice(0,200)}`); }
  }
  if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
  return json.data; // 提取 data 字段
}

export default function PricingPage() {
  const qs = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);

  useEffect(()=>{
    if (qs.get('success')) setMsg('✅ 支付成功，订阅将通过 Webhook 同步。');
    if (qs.get('canceled')) setMsg('已取消结账。');
  }, [qs]);

  const checkout = async (priceKey:'pro_monthly'|'pro_yearly')=>{
    try { setBusy(true); setMsg(null);
      const { url } = await post('/api/billing/checkout', { priceKey });
      location.href = url;
    } catch(e:any){ setMsg(e.message ?? 'failed'); } finally { setBusy(false); }
  };
  const portal = async ()=>{
    try { setBusy(true); setMsg(null);
      const { url } = await post('/api/billing/portal');
      location.href = url;
    } catch(e:any){ setMsg(e.message ?? 'failed'); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pricing</h1>
      {msg && <div className="text-emerald-300 text-sm">{msg}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded bg-white/5 p-4">
          <h3 className="text-lg font-semibold">Free</h3>
          <ul className="mt-2 text-sm opacity-80 list-disc ml-5">
            <li>项目上限 2</li><li>桌子上限 6/项目</li><li>来宾上限 60/项目</li><li>水印</li>
          </ul>
          <button className="mt-4 px-3 py-2 rounded bg-white/10 opacity-60 cursor-not-allowed">当前</button>
        </div>
        <div className="rounded bg-white/5 p-4">
          <h3 className="text-lg font-semibold">Pro</h3>
          <ul className="mt-2 text-sm opacity-80 list-disc ml-5">
            <li>项目上限 50</li><li>桌子 50/项目</li><li>来宾 2000/项目</li><li>去水印；解锁实时协作</li>
          </ul>
          <div className="mt-4 flex gap-2">
            <button disabled={busy} className="px-3 py-2 rounded bg-indigo-600/70 hover:bg-indigo-600/80" onClick={()=>checkout('pro_monthly')}>升级（月付）</button>
            <button disabled={busy} className="px-3 py-2 rounded bg-indigo-600/70 hover:bg-indigo-600/80" onClick={()=>checkout('pro_yearly')}>升级（年付）</button>
            <button disabled={busy} className="px-3 py-2 rounded bg-white/10 hover:bg-white/20" onClick={portal}>管理订阅</button>
          </div>
        </div>
      </div>
    </div>
  );
}
