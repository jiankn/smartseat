'use client';
import Link from 'next/link';

const links = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/projects/new', label: 'New Project' },
  { href: '/debug/types', label: 'Debug Types' },
  { href: '/debug/api', label: 'Debug API' },
  { href: '/debug/me', label: 'Debug Me' },
  { href: '/debug/limits', label: 'Debug Limits' }
];

export default function Sidebar() {
  return (
    <nav className="rounded-xl bg-white/5 p-3">
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href as any} className="block rounded px-3 py-2 hover:bg-white/10">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
