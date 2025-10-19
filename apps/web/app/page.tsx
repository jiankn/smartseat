import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">SmartSeat — App Scaffold</h1>
      <p className="opacity-80">
        这是 Next.js 14 的基础骨架。你可以从左侧导航进入调试页面，
        或访问 <Link href="/debug/types" className="underline">/debug/types</Link> 
        查看 <code>@smartseat/types</code> 的导入是否正常。
      </p>
      <ul className="list-disc ml-6">
        <li><Link href="/api/health" className="underline">/api/health</Link> — 健康检查（ApiResponse）</li>
      </ul>
    </div>
  );
}
