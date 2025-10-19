import { getServerSession } from 'next-auth';
import { authOptions } from '@lib/auth';
import prisma from '@smartseat/db';

const PRO_STATUSES = new Set(['active', 'trialing']); // 需要可再加 'past_due'

export default async function DebugPricingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return <div style={{ padding: 16 }}><b>Not signed in</b></div>;
  }

  const orgId = (session as any).orgId as string | undefined;
  const sub = orgId
    ? await prisma.subscription.findUnique({ where: { orgId } })
    : null;

  const env = {
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_PRICE_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY ?? null,
    STRIPE_PRICE_PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY ?? null,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
  };

  const plan = sub && PRO_STATUSES.has(sub.status) ? 'pro' : 'free';

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600 }}>Debug: pricing</h1>
      <pre style={{ marginTop: 12 }}>
        {JSON.stringify(
          {
            user: { id: (session.user as any).id, email: session.user.email },
            orgId,
            plan,
            env,
            subscription: sub,
          },
          null,
          2
        )}
      </pre>
      <p style={{ opacity: 0.7, marginTop: 8 }}>
        订阅操作请前往 <a href="/pricing" style={{ textDecoration: 'underline' }}>/pricing</a>。
      </p>
    </div>
  );
}
