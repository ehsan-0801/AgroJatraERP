import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    name: 'Starter',
    price: '৳0',
    period: '/month',
    desc: 'For individuals getting started.',
    features: ['1 user', 'Up to 100 products', 'Sales & purchases', 'Basic reports'],
    cta: 'Get started',
    highlighted: false,
  },
  {
    name: 'Business',
    price: '৳1,500',
    period: '/month',
    desc: 'For growing small businesses.',
    features: ['Up to 5 users', 'Unlimited products', 'All reports + CSV export', 'Customer dues tracking', 'Priority support'],
    cta: 'Start free trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For larger operations.',
    features: ['Unlimited users', 'Multi-branch (roadmap)', 'Dedicated support', 'Custom integrations'],
    cta: 'Contact sales',
    highlighted: false,
  },
];

export function PricingPage() {
  return (
    <>
      <section className="border-b bg-gradient-to-b from-emerald-50 to-background">
        <div className="container max-w-2xl py-20 text-center">
          <h1 className="text-4xl font-bold">Simple, transparent pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade as your business grows. No hidden fees.
          </p>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={cn(plan.highlighted && 'border-primary shadow-lg ring-1 ring-primary')}
            >
              <CardContent className="flex h-full flex-col p-6">
                {plan.highlighted && (
                  <span className="mb-3 inline-flex w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="mt-6 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="mt-6 w-full"
                  variant={plan.highlighted ? 'default' : 'outline'}
                >
                  <Link to={plan.name === 'Enterprise' ? '/contact' : '/register'}>{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Prices shown in BDT. Plans are illustrative for this demo deployment.
        </p>
      </section>
    </>
  );
}
