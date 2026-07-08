import type { PricingTier } from '@repo/domain/workspace';

// The plans Korde lays out in the pricing thread. Mirrors the prose pitch in
// `public/index.md` — keep the two in sync when pricing shifts.
export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    unit: 'forever',
    tagline: 'Plan together, always free.',
    features: [
      'Unlimited teammates',
      'Unlimited threads & plans',
      'Live preview',
      '50 agent runs / month',
    ],
    cta: 'Get started',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$0.10',
    unit: 'per agent run',
    tagline: 'Pay only for what ships.',
    features: [
      'Everything in Free',
      'Unlimited agent runs',
      'Automatic PRs',
      'Priority builds',
      'Email support',
    ],
    cta: 'Start building',
    featured: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    tagline: 'For security and scale.',
    features: ['Everything in Pro', 'SSO & SAML', 'Volume discounts', 'Dedicated support & SLAs'],
    cta: 'Contact sales',
  },
];
