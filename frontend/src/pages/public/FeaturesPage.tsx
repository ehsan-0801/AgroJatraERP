import { BarChart3, Boxes, FileText, LayoutDashboard, Lock, Moon, ShoppingCart, Truck, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const SECTIONS = [
  { icon: LayoutDashboard, k: 'dashboard' }, { icon: Boxes, k: 'products' }, { icon: ShoppingCart, k: 'purchases' },
  { icon: BarChart3, k: 'sales' }, { icon: Users, k: 'customers' }, { icon: Truck, k: 'suppliers' },
  { icon: FileText, k: 'reports' }, { icon: Lock, k: 'security' }, { icon: Moon, k: 'experience' },
] as const;

export function FeaturesPage() {
  const { t } = useTranslation();
  return (
    <>
      <section className="border-b bg-gradient-to-b from-emerald-50 to-background">
        <div className="container max-w-2xl py-20 text-center">
          <h1 className="text-4xl font-bold">{t('features.title')}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{t('features.subtitle')}</p>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => {
            const points = t(`features.sections.${s.k}.p`, { returnObjects: true }) as string[];
            return (
              <Card key={s.k}>
                <CardContent className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><s.icon className="h-5 w-5" /></div>
                  <h3 className="mt-4 font-semibold">{t(`features.sections.${s.k}.t`)}</h3>
                  <ul className="mt-3 space-y-1.5">
                    {points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="mt-14 text-center">
          <Button size="lg" asChild><Link to="/login">{t('features.cta')}</Link></Button>
        </div>
      </section>
    </>
  );
}
