import { Heart, Rocket, Target } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';

const VALUES = [{ icon: Target, k: 'mission' }, { icon: Rocket, k: 'vision' }, { icon: Heart, k: 'values' }] as const;

export function AboutPage() {
  const { t } = useTranslation();
  const story = t('about.story', { returnObjects: true }) as string[];
  return (
    <>
      <section className="border-b bg-gradient-to-b from-emerald-50 to-background">
        <div className="container max-w-3xl py-20 text-center">
          <h1 className="text-4xl font-bold">{t('about.title')}</h1>
          <p className="mt-5 text-lg text-muted-foreground">
            <Trans i18nKey="about.intro" components={{ strong: <strong />, em: <em /> }} />
          </p>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {VALUES.map((v) => (
            <Card key={v.k}>
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><v.icon className="h-5 w-5" /></div>
                <h3 className="mt-4 font-semibold">{t(`about.${v.k}.t`)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(`about.${v.k}.d`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-3xl space-y-4 text-muted-foreground">
          <h2 className="text-2xl font-bold text-foreground">{t('about.storyTitle')}</h2>
          {story.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>
    </>
  );
}
