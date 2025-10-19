'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function SignInPage() {
  const [email, setEmail] = useState('owner@example.com');
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await signIn('credentials', {
      email,
      redirect: true,
      callbackUrl: '/'
    });
    // 若 redirect: true，失败会留在本页、成功跳转到首页
    if (res?.error) setMsg(res.error);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Sign in (Dev)</h1>
      <p className="opacity-80 text-sm">
        仅在本地开发启用；邮箱需在 <code>DEV_LOGIN_ALLOW</code> 白名单中。
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full rounded bg-white/10 px-3 py-2 outline-none"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <button className="px-3 py-2 rounded bg-white/10 hover:bg-white/20">Sign in</button>
        {msg && <div className="text-red-300 text-sm">{msg}</div>}
      </form>
    </div>
  );
}
