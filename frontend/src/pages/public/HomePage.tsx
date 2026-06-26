import {
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Lock,
  Moon,
  Quote,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  TrendingUp,
  Truck,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Accordion, type FaqItem } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CountUp } from '@/components/CountUp';
import { Reveal } from '@/components/Reveal';

const MODULES = [
  { icon: Boxes, title: 'Inventory & Products', desc: 'SKUs, barcodes, units, pricing and low-stock alerts — always in sync.' },
  { icon: ShoppingCart, title: 'Purchasing', desc: 'Multi line-item purchases with tax & discount. Stock rises automatically.' },
  { icon: BarChart3, title: 'Sales & Invoicing', desc: 'Validated sales, instant invoices, automatic stock deduction.' },
  { icon: Users, title: 'Customers', desc: 'Profiles, purchase history and outstanding-due tracking.' },
  { icon: Truck, title: 'Suppliers', desc: 'Your supply-chain partners and their order history, organized.' },
  { icon: FileText, title: 'Reports & Export', desc: 'Product, sales, purchase & customer reports — export to CSV.' },
  { icon: LayoutDashboard, title: 'Live Dashboard', desc: '8 real-time KPIs with sales & purchase trend charts.' },
  { icon: Lock, title: 'Security', desc: 'Auth, protected routes, Row Level Security and soft deletes.' },
  { icon: Settings2, title: 'Settings', desc: 'Business info, currency, timezone and light/dark theme.' },
];

const STEPS = [
  { icon: UserPlus, title: 'Create your account', desc: 'Sign up in seconds with secure Supabase authentication.' },
  { icon: Boxes, title: 'Add products & contacts', desc: 'Import your catalog, customers and suppliers.' },
  { icon: ShoppingCart, title: 'Record purchases & sales', desc: 'Stock updates automatically with every transaction.' },
  { icon: TrendingUp, title: 'Watch your business grow', desc: 'Track KPIs, trends and reports from one dashboard.' },
];

const BENEFITS = [
  { icon: Zap, title: 'Automatic stock movements', desc: 'Purchases increase stock, sales decrease it — never below zero, validated in real time.' },
  { icon: ShieldCheck, title: 'Secure by design', desc: 'Protected routes, server-side validation, Row Level Security and audit-friendly soft deletes.' },
  { icon: Moon, title: 'Beautiful on any device', desc: 'A clean, minimal, dashboard-first UI with dark & light themes, responsive everywhere.' },
];

const KPI_PREVIEW = [
  { label: 'Products', value: 248 },
  { label: 'Customers', value: 132 },
  { label: 'Revenue', value: 1284500, prefix: '৳' },
  { label: 'Low Stock', value: 7 },
];

const TESTIMONIALS = [
  { name: 'Rahim Traders', role: 'Wholesale, Dhaka', quote: 'We replaced three spreadsheets with AgroJatra. Stock is finally accurate and sales take seconds.' },
  { name: 'Nadia Mart', role: 'Retail, Chattogram', quote: 'The dashboard tells me exactly how my shop is doing each morning. Clean and fast.' },
  { name: 'Green Agro Supply', role: 'Distribution, Khulna', quote: 'Purchases and sales auto-adjust inventory. No more end-of-day stock counting headaches.' },
];

const FAQS: FaqItem[] = [
  { q: 'Is AgroJatra ERP suitable for my industry?', a: 'Yes. Although the name is inspired by “অগ্রযাত্রা” (forward journey), it works for retail, wholesale, distribution and service businesses alike.' },
  { q: 'How does stock stay accurate?', a: 'Every purchase increases stock and every sale validates and decreases it inside a database transaction, so your inventory is always correct and never goes negative.' },
  { q: 'Is my data secure?', a: 'Authentication is handled by Supabase, every API request is verified, data is isolated per owner with Row Level Security, and deletes are soft so nothing is lost.' },
  { q: 'Can I export my reports?', a: 'Yes — product, sales, purchase, customer and supplier reports can be exported to CSV directly from the Reports page.' },
  { q: 'Does it work on mobile?', a: 'Absolutely. The interface is fully responsive and supports light, dark and system themes.' },
];

const MARQUEE = ['Inventory', 'Purchasing', 'Sales', 'Invoicing', 'Customers', 'Suppliers', 'Reports', 'Analytics', 'Dashboard', 'Settings'];

export function HomePage() {
  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-grid" />
        <div className="blob -left-20 top-0 h-72 w-72 animate-float-slow bg-emerald-400/30" />
        <div className="blob right-0 top-32 h-80 w-80 animate-float bg-teal-400/20" />

        <div className="container grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex animate-fade-in items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Modern ERP for SMEs in Bangladesh
            </span>
            <h1 className="mt-5 animate-fade-up text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Everything Your Business <span className="text-gradient">Needs in One Place</span>
            </h1>
            <p className="mt-6 max-w-lg animate-fade-up text-lg text-muted-foreground [animation-delay:120ms]">
              AgroJatra ERP centralizes inventory, purchasing, sales, customers, suppliers
              and analytics into a single, clean, lightning-fast platform.
            </p>
            <div className="mt-8 flex animate-fade-up flex-wrap gap-3 [animation-delay:240ms]">
              <Button size="lg" className="group gap-2" asChild>
                <Link to="/register">
                  Get started free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/features">Explore features</Link>
              </Button>
            </div>
            <div className="mt-7 flex animate-fade-up flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground [animation-delay:360ms]">
              {['No setup fees', 'Secure authentication', 'Cancel anytime'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Floating dashboard mock */}
          <div className="relative animate-fade-up [animation-delay:200ms]">
            <Card className="animate-float-slow shadow-2xl ring-1 ring-border/60">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">A</div>
                    <span className="text-sm font-semibold">Dashboard</span>
                  </div>
                  <div className="flex gap-1">
                    {['bg-red-400', 'bg-amber-400', 'bg-emerald-400'].map((c) => (
                      <span key={c} className={`h-2.5 w-2.5 rounded-full ${c}`} />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {KPI_PREVIEW.map((k) => (
                    <div key={k.label} className="rounded-lg border bg-muted/40 p-3">
                      <p className="text-lg font-bold text-primary">
                        <CountUp to={k.value} prefix={k.prefix} />
                      </p>
                      <p className="text-[11px] text-muted-foreground">{k.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-lg border bg-muted/40 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">Sales trend</span>
                    <span className="text-[11px] font-medium text-emerald-500">+24%</span>
                  </div>
                  <div className="flex h-24 items-end gap-2">
                    {[40, 62, 48, 80, 58, 92, 70].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 origin-bottom animate-grow-bar rounded-t bg-gradient-to-t from-primary/40 to-primary"
                        style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="absolute -bottom-4 -right-4 hidden animate-float rounded-xl border bg-card px-4 py-3 shadow-lg sm:block">
              <p className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-emerald-500" /> Stock auto-updated
              </p>
            </div>
          </div>
        </div>

        {/* marquee strip */}
        <div className="relative overflow-hidden border-t bg-muted/30 py-4">
          <div className="flex w-max animate-marquee gap-10 pr-10">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Stats ───────── */}
      <section className="border-b">
        <div className="container grid grid-cols-2 gap-8 py-14 lg:grid-cols-4">
          {[
            { n: 9, s: '+', l: 'Connected modules' },
            { n: 8, s: '', l: 'Live dashboard KPIs' },
            { n: 100, s: '%', l: 'Cloud-based' },
            { n: 24, s: '/7', l: 'Always available' },
          ].map((stat, i) => (
            <Reveal key={stat.l} delay={i * 90} className="text-center">
              <p className="text-4xl font-bold text-gradient sm:text-5xl">
                <CountUp to={stat.n} suffix={stat.s} />
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.l}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── Modules ───────── */}
      <section className="container py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Modules</span>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">One platform, every workflow</h2>
          <p className="mt-3 text-muted-foreground">
            Replace spreadsheets and disconnected tools with a single source of truth.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, i) => (
            <Reveal key={m.title} delay={(i % 3) * 100}>
              <Card className="group h-full transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <m.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{m.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section className="border-y bg-muted/30">
        <div className="container py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">How it works</span>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Up and running in minutes</h2>
          </Reveal>
          <div className="relative mt-16 grid gap-8 md:grid-cols-4">
            <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 120} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border bg-background shadow-sm">
                  <step.icon className="h-6 w-6 text-primary" />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Dashboard preview + benefits ───────── */}
      <section className="container py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Why AgroJatra</span>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Built for clarity, speed and trust</h2>
            <p className="mt-4 text-muted-foreground">
              Every detail is designed so you spend less time on data entry and more time growing.
            </p>
            <div className="mt-8 space-y-6">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <b.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{b.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={150}>
            <Card className="overflow-hidden shadow-xl">
              <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
                <div className="flex gap-1.5">
                  {['bg-red-400', 'bg-amber-400', 'bg-emerald-400'].map((c) => (
                    <span key={c} className={`h-3 w-3 rounded-full ${c}`} />
                  ))}
                </div>
                <span className="ml-2 text-xs text-muted-foreground">app.agrojatra.com/dashboard</span>
              </div>
              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: 'Revenue', v: '৳1.28M' },
                    { l: 'Sales', v: '512' },
                    { l: 'Inventory', v: '৳840K' },
                  ].map((k) => (
                    <div key={k.l} className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-sm font-bold">{k.v}</p>
                      <p className="text-[11px] text-muted-foreground">{k.l}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex h-28 items-end gap-1.5">
                    {[30, 50, 42, 70, 55, 84, 62, 90, 76].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-emerald-500/30 to-emerald-500" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {['Rice 5kg', 'Sugar 1kg', 'Lentils 1kg'].map((p, i) => (
                    <div key={p} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span>{p}</span>
                      <span className="font-medium text-emerald-500">+{(i + 1) * 12} sold</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ───────── Testimonials ───────── */}
      <section className="border-y bg-muted/30">
        <div className="container py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Loved by businesses</span>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Trusted across industries</h2>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 110}>
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col p-6">
                    <Quote className="h-7 w-7 text-primary/40" />
                    <p className="mt-3 flex-1 text-sm leading-relaxed">{t.quote}</p>
                    <div className="mt-5 flex items-center gap-1 text-amber-400">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <div className="mt-3">
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="container py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">FAQ</span>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Frequently asked questions</h2>
        </Reveal>
        <Reveal className="mx-auto mt-12 max-w-3xl">
          <Accordion items={FAQS} />
        </Reveal>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="container pb-24">
        <Reveal>
          <Card className="relative overflow-hidden border-0">
            <div className="absolute inset-0 animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600" />
            <CardContent className="relative flex flex-col items-center gap-5 p-12 text-center text-white sm:p-16">
              <h2 className="text-3xl font-bold sm:text-4xl">Ready to grow your business?</h2>
              <p className="max-w-md text-white/90">
                Join AgroJatra ERP and run your entire operation from one beautiful dashboard.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button size="lg" variant="secondary" className="group gap-2" asChild>
                  <Link to="/register">
                    Create your free account
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white" asChild>
                  <Link to="/pricing">View pricing</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </>
  );
}
