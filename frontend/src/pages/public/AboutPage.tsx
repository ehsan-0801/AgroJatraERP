import { Target, Rocket, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const VALUES = [
  { icon: Target, title: 'Our Mission', desc: 'Empower small and medium businesses with affordable, modern software that was once only available to large enterprises.' },
  { icon: Rocket, title: 'Our Vision', desc: 'Become the go-to operating system for growing businesses across Bangladesh and beyond.' },
  { icon: Heart, title: 'Our Values', desc: 'Simplicity, reliability and accessibility — software that respects your time and your customers.' },
];

export function AboutPage() {
  return (
    <>
      <section className="border-b bg-gradient-to-b from-emerald-50 to-background">
        <div className="container max-w-3xl py-20 text-center">
          <h1 className="text-4xl font-bold">About AgroJatra ERP</h1>
          <p className="mt-5 text-lg text-muted-foreground">
            <strong>AgroJatra</strong> symbolizes a journey of growth and progress. Inspired by the
            Bengali word <em>“অগ্রযাত্রা”</em> (forward journey), our platform is built to help
            businesses across every industry move forward — not just agriculture.
          </p>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {VALUES.map((v) => (
            <Card key={v.title}>
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-3xl space-y-4 text-muted-foreground">
          <h2 className="text-2xl font-bold text-foreground">Our story</h2>
          <p>
            Many businesses in Bangladesh still run on paper ledgers and scattered spreadsheets.
            AgroJatra ERP was created to change that — bringing inventory, purchasing, sales,
            customers, suppliers, reporting and analytics together into one centralized, easy-to-use
            platform.
          </p>
          <p>
            We focus on a clean, minimal, dashboard-first experience that works on any device, with
            secure authentication and your data protected at every layer. Whether you run a shop, a
            wholesale operation, or a growing distribution business, AgroJatra ERP grows with you.
          </p>
        </div>
      </section>
    </>
  );
}
