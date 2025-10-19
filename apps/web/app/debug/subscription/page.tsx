import prisma from '@smartseat/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@lib/auth';

export default async function DebugSubscriptionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return <pre>Not signed in</pre>;
  }
  const orgId = (session as any).orgId as string | undefined;
  if (!orgId) return <pre>No org bound to session</pre>;

  const sub = await prisma.subscription.findUnique({ where: { orgId } });
  return (
    <div style={{padding:16}}>
      <h2>Debug: subscription</h2>
      <pre>{JSON.stringify({ orgId, subscription: sub }, null, 2)}</pre>
    </div>
  );
}
