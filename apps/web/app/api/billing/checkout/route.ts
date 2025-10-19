export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@lib/auth';
import prisma from '@smartseat/db';
import { ok, err } from '@smartseat/utils';
import { stripe, priceIdFor } from '@lib/stripe';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err('UNAUTHORIZED', 'Sign in required', 401);
  const orgId = (session as any).orgId as string;

  const body = (await req.json().catch(() => ({}))) as { priceKey?: 'pro_monthly' | 'pro_yearly' };
  const priceId = priceIdFor(body.priceKey ?? 'pro_monthly');

  // 找/建 Stripe Customer
  const existing = await prisma.subscription.findUnique({ where: { orgId } });
  let customerId = existing?.stripeCustomerId ?? null;
  if (!customerId) {
    const cust = await stripe.customers.create({
      description: `SmartSeat Org ${orgId}`,
      metadata: { orgId }
    });
    customerId = cust.id;
    await prisma.subscription.upsert({
      where: { orgId },
      update: { stripeCustomerId: customerId },
      create: { orgId, plan: 'pro', status: 'init', stripeCustomerId: customerId }
    });
  }

  const origin = new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000').origin;
  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: process.env.STRIPE_SUCCESS_URL ?? `${origin}/pricing?success=1`,
    cancel_url : process.env.STRIPE_CANCEL_URL  ?? `${origin}/pricing?canceled=1`,
    client_reference_id: orgId,
    allow_promotion_codes: true
  });

  console.log('[CHECKOUT] Created session:', { id: checkout.id, url: checkout.url, customerId, priceId });
  return ok({ url: checkout.url });
}
