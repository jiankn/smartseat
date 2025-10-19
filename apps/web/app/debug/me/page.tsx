import { getServerSession } from 'next-auth';
import { authOptions } from '@lib/auth';

export default async function Page() {
  const session = await getServerSession(authOptions);
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Debug: session</h2>
      <pre className="bg-black/40 rounded p-3 overflow-auto">
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
}
