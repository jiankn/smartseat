import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-09-30.clover',
});


export function priceIdFor(input?: string | null): string {
  if (input === 'pro_yearly' && process.env.STRIPE_PRICE_PRO_YEARLY) {
    return process.env.STRIPE_PRICE_PRO_YEARLY!;
  }
  return process.env.STRIPE_PRICE_PRO_MONTHLY!;
}

export function planByPriceId(_priceId: string): 'pro' {
  return 'pro'; // 目前只有 Pro，一律映射到 pro
}
