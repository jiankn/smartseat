export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@lib/auth';
import prisma from '@smartseat/db';
import { ok, err } from '@smartseat/utils';
import { stripe } from '@lib/stripe';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return err('UNAUTHORIZED', 'Sign in required', 401);
    const orgId = (session as any).orgId as string | undefined;
    if (!orgId) return err('NO_ORG', 'No organization bound to session', 400);

    // 1) 取订阅记录，没有则先建一条 "init"
    let sub = await prisma.subscription.findUnique({ where: { orgId } });
    if (!sub) {
      sub = await prisma.subscription.create({
        data: { orgId, plan: 'pro', status: 'init' }
      });
    }

    // 2) 若没有 customerId，自动创建 Stripe Customer 并落库
    let customerId = sub.stripeCustomerId ?? null;
    if (!customerId) {
      const cust = await stripe.customers.create({
        description: `SmartSeat Org ${orgId}`,
        metadata: { orgId },
      });
      customerId = cust.id;
      await prisma.subscription.update({
        where: { orgId },
        data: { stripeCustomerId: customerId }
      });
    }

    // 3) 创建 Billing Portal 会话
    const origin = new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000').origin;
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId!,
      return_url: `${origin}/pricing`,
    });

    return ok({ url: portal.url });
  } catch (e: any) {
    console.error('[billing/portal] error:', e);
    return err('PORTAL_FAILED', e?.message ?? 'unknown', 500);
  }
}
