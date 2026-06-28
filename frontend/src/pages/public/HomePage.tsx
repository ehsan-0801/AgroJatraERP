import {
  ArrowRight, BarChart3, Boxes, CheckCircle2, FileText, LayoutDashboard, Lock, Moon, Quote,
  Settings2, ShieldCheck, ShoppingCart, Sparkles, Star, TrendingUp, Truck, UserPlus, Users, Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSiteContent } from '@/store/siteContent';
import { Accordion, type FaqItem } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CountUp } from '@/components/CountUp';
import { Reveal } from '@/components/Reveal';

const MODULES = [
  { icon: Boxes, k: 'inventory' }, { icon: ShoppingCart, k: 'purchasing' }, { icon: BarChart3, k: 'sales' },
  { icon: Users, k: 'customers' }, { icon: Truck, k: 'suppliers' }, { icon: FileText, k: 'reports' },
  { icon: LayoutDashboard, k: 'dashboard' }, { icon: Lock, k: 'security' }, { icon: Settings2, k: 'settings' },
] as const;

const STEPS = [
  { icon: UserPlus, k: 'account' }, { icon: ShieldCheck, k: 'team' }, { icon: Boxes, k: 'catalog' }, { icon: TrendingUp, k: 'run' },
] as const;

const BENEFITS = [{ icon: Zap, k: 'stock' }, { icon: ShieldCheck, k: 'secure' }, { icon: Moon, k: 'device' }] as const;

const KPI_PREVIEW = [
  { k: 'total_products', value: 248 }, { k: 'total_customers', value: 132 },
  { k: 'revenue', value: 1284500, prefix: '৳' }, { k: 'low_stock', value: 7 },
] as const;

const STATS = [
  { n: 9, s: '+', k: 'businesses' }, { n: 8, s: '', k: 'kpis' }, { n: 100, s: '%', k: 'cloud' }, { n: 24, s: '/7', k: 'available' },
] as const;

const WORKFLOW = [
  { icon: Boxes, k: 'products', img: '/agrajatra/inventory.png' },
  { icon: Truck, k: 'suppliers', img: '/agrajatra/suppliers.png' },
  { icon: ShoppingCart, k: 'purchases', img: '/agrajatra/purchase.png' },
  { icon: Users, k: 'customers', img: '/agrajatra/Customer.png' },
  { icon: BarChart3, k: 'sales', img: '/agrajatra/Sale.png' },
  { icon: FileText, k: 'invoices', img: '/agrajatra/invoice.png' },
  { icon: TrendingUp, k: 'reports', img: '/agrajatra/Reports.png' },
] as const;

/** Draggable workflow node graph — each card holds its image + text together,
 *  connectors follow the nodes as you drag them around the canvas. */
function WorkflowGraph() {
  const { t } = useTranslation();
  const W = 240, H = 280, CW = 1180, CH = 680;
  const INITIAL = [
    { x: 20, y: 24 }, { x: 320, y: 24 }, { x: 620, y: 24 }, { x: 920, y: 24 },
    { x: 170, y: 376 }, { x: 470, y: 376 }, { x: 770, y: 376 },
  ];
  const [pos, setPos] = useState(INITIAL);
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ i: number; dx: number; dy: number; rect: DOMRect } | null>(null);

  const onDown = (e: React.PointerEvent, i: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { i, dx: e.clientX - rect.left - pos[i].x, dy: e.clientY - rect.top - pos[i].y, rect };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const { i, dx, dy, rect } = drag.current;
    const x = Math.max(0, Math.min(CW - W, e.clientX - rect.left - dx));
    const y = Math.max(0, Math.min(CH - H, e.clientY - rect.top - dy));
    setPos((p) => p.map((q, idx) => (idx === i ? { x, y } : q)));
  };
  const onUp = () => { drag.current = null; };
  const center = (i: number) => ({ cx: pos[i].x + W / 2, cy: pos[i].y + H / 2 });

  return (
    <>
      <p className="mt-6 text-center text-xs font-medium text-muted-foreground">{t('home.workflow.drag')}</p>
      <div className="mt-6 overflow-x-auto pb-4">
        <div ref={canvasRef} className="relative mx-auto" style={{ width: CW, height: CH }}
          onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
          <svg className="pointer-events-none absolute inset-0" width={CW} height={CH}>
            {WORKFLOW.slice(0, -1).map((_, i) => {
              const a = center(i), b = center(i + 1);
              return <line key={i} x1={a.cx} y1={a.cy} x2={b.cx} y2={b.cy} stroke="currentColor" className="text-primary/40" strokeWidth={3} strokeDasharray="6 8" strokeLinecap="round" />;
            })}
          </svg>
          {WORKFLOW.map((step, i) => (
            <div key={step.k} onPointerDown={(e) => onDown(e, i)} style={{ left: pos[i].x, top: pos[i].y, width: W }}
              className="group absolute cursor-grab touch-none select-none rounded-2xl border border-slate-200 bg-white shadow-md transition-shadow hover:shadow-xl active:cursor-grabbing active:shadow-2xl">
              <img src={step.img} alt="" draggable={false} className="pointer-events-none h-36 w-full rounded-t-2xl object-cover" />
              <div className="px-4 pb-4 text-center">
                <span className="mx-auto -mt-7 mb-1.5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-4 ring-white"><step.icon className="h-6 w-6" /></span>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{t('home.workflow.stepLabel')} {i + 1}</p>
                <p className="text-lg font-bold leading-tight text-slate-800">{t(`home.workflow.steps.${step.k}.t`)}</p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">{t(`home.workflow.steps.${step.k}.d`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const showcase = useSiteContent((s) => s.showcase);
  const reviews = useSiteContent((s) => s.reviews);
  const [previewReady, setPreviewReady] = useState(false);
  useEffect(() => { const id = setTimeout(() => setPreviewReady(true), 1000); return () => clearTimeout(id); }, []);

  const chips = t('home.hero.chips', { returnObjects: true }) as string[];
  const staticTestimonials = t('home.testimonials.items', { returnObjects: true }) as { quote: string; name: string; role: string }[];
  const testimonials = reviews.length
    ? reviews.map((r) => ({ quote: r.comment, name: r.organization_name, role: r.author_name || r.organization_address || '', rating: r.rating }))
    : staticTestimonials.map((s) => ({ ...s, rating: 5 }));
  const faqs = t('home.faq.items', { returnObjects: true }) as FaqItem[];

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
              <Sparkles className="h-3.5 w-3.5" /> {t('home.hero.badge')}
            </span>
            <h1 className="mt-5 animate-fade-up text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              {t('home.hero.title')} <span className="text-gradient">{t('home.hero.titleHighlight')}</span>
            </h1>
            <p className="mt-6 max-w-lg animate-fade-up text-lg text-muted-foreground [animation-delay:120ms]">{t('home.hero.subtitle')}</p>
            <div className="mt-8 flex animate-fade-up flex-wrap gap-3 [animation-delay:240ms]">
              <Button size="lg" className="group gap-2" asChild>
                <Link to="/register">{t('home.hero.getStarted')}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild><Link to="/login">{t('home.hero.signIn')}</Link></Button>
            </div>
            <div className="mt-7 flex animate-fade-up flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground [animation-delay:360ms]">
              {chips.map((c) => (
                <span key={c} className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> {c}</span>
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
                    <span className="text-sm font-semibold">{t('common.dashboard')}</span>
                  </div>
                  <div className="flex gap-1">
                    {['bg-red-400', 'bg-amber-400', 'bg-emerald-400'].map((c) => <span key={c} className={`h-2.5 w-2.5 rounded-full ${c}`} />)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {KPI_PREVIEW.map((k) => (
                    <div key={k.k} className="rounded-lg border bg-muted/40 p-3">
                      {previewReady
                        ? <p className="text-lg font-bold text-primary"><CountUp to={k.value} prefix={'prefix' in k ? k.prefix : undefined} /></p>
                        : <Skeleton className="h-6 w-16" />}
                      <p className="mt-1 text-[11px] text-muted-foreground">{t(`dashboard.kpis.${k.k}`)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-lg border bg-muted/40 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">{t('dashboard.salesTrend')}</span>
                    <span className="text-[11px] font-medium text-emerald-500">+24%</span>
                  </div>
                  <div className="flex h-24 items-end gap-2">
                    {[40, 62, 48, 80, 58, 92, 70].map((h, i) => previewReady
                      ? <div key={i} className="flex-1 origin-bottom animate-grow-bar rounded-t bg-gradient-to-t from-primary/40 to-primary" style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }} />
                      : <Skeleton key={i} className="flex-1" style={{ height: `${h}%` }} />)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* workflow — node graph */}
        <div className="relative overflow-hidden border-t bg-white py-16">
          <div className="pointer-events-none absolute inset-0 bg-grid-canvas" />
          <div className="container relative">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">{t('home.workflow.eyebrow')}</span>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{t('home.workflow.title')}</h2>
              <p className="mt-3 text-muted-foreground">{t('home.workflow.subtitle')}</p>
            </Reveal>

            <WorkflowGraph />
          </div>
        </div>
      </section>

      {/* ───────── Stats ───────── */}
      <section className="border-b">
        <div className="container grid grid-cols-2 gap-8 py-14 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <Reveal key={stat.k} delay={i * 90} className="text-center">
              <p className="text-4xl font-bold text-gradient sm:text-5xl"><CountUp to={stat.n} suffix={stat.s} /></p>
              <p className="mt-2 text-sm text-muted-foreground">{t(`home.stats.${stat.k}`)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── Modules ───────── */}
      <section className="container py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">{t('home.modules.eyebrow')}</span>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{t('home.modules.title')}</h2>
          <p className="mt-3 text-muted-foreground">{t('home.modules.subtitle')}</p>
        </Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, i) => (
            <Reveal key={m.k} delay={(i % 3) * 100}>
              <Card className="group h-full transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <m.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{t(`home.modules.items.${m.k}.t`)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t(`home.modules.items.${m.k}.d`)}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── Product showcase (super-admin managed) ───────── */}
      {showcase.length > 0 && (
        <section className="border-t bg-muted/30">
          <div className="container py-24">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">{t('home.showcase.eyebrow')}</span>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{t('home.showcase.title')}</h2>
              <p className="mt-3 text-muted-foreground">{t('home.showcase.subtitle')}</p>
            </Reveal>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {showcase.map((p, i) => (
                <Reveal key={i} delay={(i % 4) * 90}>
                  <Card className="group h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
                    <div className="overflow-hidden">
                      <img src={p.url} alt={p.name ?? ''} loading="lazy" className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    {p.name && <div className="p-4 text-center font-semibold">{p.name}</div>}
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────── Get started ───────── */}
      <section className="border-y bg-muted/30">
        <div className="container py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">{t('home.getStarted.eyebrow')}</span>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{t('home.getStarted.title')}</h2>
          </Reveal>
          <div className="relative mt-16 grid gap-8 md:grid-cols-4">
            <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
            {STEPS.map((step, i) => (
              <Reveal key={step.k} delay={i * 120} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border bg-background shadow-sm">
                  <step.icon className="h-6 w-6 text-primary" />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold">{t(`home.getStarted.steps.${step.k}.t`)}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{t(`home.getStarted.steps.${step.k}.d`)}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Why + dashboard preview ───────── */}
      <section className="container py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">{t('home.why.eyebrow')}</span>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{t('home.why.title')}</h2>
            <p className="mt-4 text-muted-foreground">{t('home.why.subtitle')}</p>
            <div className="mt-8 space-y-6">
              {BENEFITS.map((b) => (
                <div key={b.k} className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><b.icon className="h-5 w-5" /></div>
                  <div>
                    <h3 className="font-semibold">{t(`home.why.benefits.${b.k}.t`)}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{t(`home.why.benefits.${b.k}.d`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={150}>
            <Card className="overflow-hidden shadow-xl">
              <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
                <div className="flex gap-1.5">{['bg-red-400', 'bg-amber-400', 'bg-emerald-400'].map((c) => <span key={c} className={`h-3 w-3 rounded-full ${c}`} />)}</div>
                <span className="ml-2 text-xs text-muted-foreground">app.agrojatra.com/dashboard</span>
              </div>
              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-3 gap-3">
                  {[{ l: t('dashboard.kpis.revenue'), v: '৳1.28M' }, { l: t('dashboard.kpis.total_sales'), v: '512' }, { l: t('dashboard.kpis.inventory_value'), v: '৳840K' }].map((k) => (
                    <div key={k.l} className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-sm font-bold">{k.v}</p>
                      <p className="text-[11px] text-muted-foreground">{k.l}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex h-28 items-end gap-1.5">
                    {[30, 50, 42, 70, 55, 84, 62, 90, 76].map((h, i) => <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-emerald-500/30 to-emerald-500" style={{ height: `${h}%` }} />)}
                  </div>
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
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">{t('home.testimonials.eyebrow')}</span>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{t('home.testimonials.title')}</h2>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((tm, i) => (
              <Reveal key={`${tm.name}-${i}`} delay={i * 110}>
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col p-6">
                    <Quote className="h-7 w-7 text-primary/40" />
                    <p className="mt-3 flex-1 text-sm leading-relaxed">{tm.quote}</p>
                    <div className="mt-5 flex items-center gap-1 text-amber-400">{Array.from({ length: 5 }).map((_, s) => <Star key={s} className={`h-4 w-4 ${s < (tm.rating ?? 5) ? 'fill-current' : 'fill-none text-muted-foreground/30'}`} />)}</div>
                    <div className="mt-3"><p className="font-semibold">{tm.name}</p>{tm.role && <p className="text-xs text-muted-foreground">{tm.role}</p>}</div>
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
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">{t('home.faq.eyebrow')}</span>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{t('home.faq.title')}</h2>
        </Reveal>
        <Reveal className="mx-auto mt-12 max-w-3xl"><Accordion items={faqs} /></Reveal>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="container pb-24">
        <Reveal>
          <Card className="relative overflow-hidden border-0">
            <div className="absolute inset-0 animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600" />
            <CardContent className="relative flex flex-col items-center gap-5 p-12 text-center text-white sm:p-16">
              <h2 className="text-3xl font-bold sm:text-4xl">{t('home.cta.title')}</h2>
              <p className="max-w-md text-white/90">{t('home.cta.subtitle')}</p>
              <Button size="lg" variant="secondary" className="group gap-2" asChild>
                <Link to="/register">{t('home.cta.button')}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
              </Button>
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </>
  );
}
