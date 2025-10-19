export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@smartseat/db';
import { stripe, planByPriceId } from '@lib/stripe';
import type Stripe from 'stripe';

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ ok:false, error:{code:'NO_SIG', message:'Missing signature/secret'} }, { status:400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch (err:any) {
    return NextResponse.json({ ok:false, error:{code:'INVALID_SIG', message:err.message} }, { status:400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        const orgId = s.client_reference_id as string | null;
        const customerId = (s.customer as string) ?? null;
        const subId = (s.subscription as string) ?? null;
        if (orgId) {
          await prisma.subscription.upsert({
            where: { orgId },
            update: { stripeCustomerId: customerId ?? undefined, stripeSubscriptionId: subId ?? undefined },
            create: { orgId, plan:'pro', status:'pending', stripeCustomerId: customerId ?? undefined, stripeSubscriptionId: subId ?? undefined }
          });
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const subId = sub.id;
        const status = sub.status; // active | trialing | past_due | canceled ...
        const priceId = sub.items?.data?.[0]?.price?.id || '';

        const customer = await stripe.customers.retrieve(customerId);
        const orgId = (customer as any)?.metadata?.orgId as string | undefined;
        if (orgId) {
          await prisma.subscription.upsert({
            where: { orgId },
            update: {
              plan: planByPriceId(priceId),
              status,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subId,
              currentPeriodEnd: (sub as any).current_period_end ? new Date((sub as any).current_period_end * 1000) : null
            },
            create: {
              orgId,
              plan: planByPriceId(priceId),
              status,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subId,
              currentPeriodEnd: (sub as any).current_period_end ? new Date((sub as any).current_period_end * 1000) : null
            }
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (e:any) {
    console.error('[stripe webhook] error:', e);
    return NextResponse.json({ ok:false, error:{code:'WEBHOOK_HANDLER', message:e.message} }, { status:500 });
  }

  return NextResponse.json({ received: true });
}
