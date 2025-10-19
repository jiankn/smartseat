'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function Header() {
  const { data: session, status } = useSession();
  const authed = status === 'authenticated';
  const [plan, setPlan] = useState<string>('free');

  useEffect(() => {
    if (authed) {
      // 获取实际套餐信息（可选）
      // 这里暂时显示 'dev' 作为占位符
      setPlan('dev');
    }
  }, [authed]);

  return (
    <header className="w-full border-b border-white/10 bg-white/5">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="font-semibold tracking-wide">
          <Link href="/">SmartSeat</Link>
        </div>

        <div className="text-sm opacity-80 flex items-center gap-3">
          {status === 'loading' ? (
            <span>…</span>
          ) : authed ? (
            <>
              <span className="px-2 py-0.5 text-xs rounded bg-white/10">
                {typeof (session as any)?.orgId === 'string' ? 'Org' : '–'}
              </span>
              <span className="px-2 py-0.5 text-xs rounded bg-indigo-600/50">
                Plan: {plan}
              </span>
              <span>👋 {session?.user?.name ?? session?.user?.email}</span>
              <button
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
                onClick={() => signOut()}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
