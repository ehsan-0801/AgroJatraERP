import { Mail, MapPin, Phone } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ContactPage() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);

  const CONTACTS = [
    { icon: Mail, label: t('contact.email'), value: 'hello@agrojatra.com' },
    { icon: Phone, label: t('contact.phone'), value: '+880 1700-000000' },
    { icon: MapPin, label: t('contact.location'), value: 'Dhaka, Bangladesh' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    toast.success(t('contact.sentBody'));
  };

  return (
    <>
      <section className="border-b bg-gradient-to-b from-emerald-50 to-background">
        <div className="container max-w-2xl py-20 text-center">
          <h1 className="text-4xl font-bold">{t('contact.title')}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{t('contact.subtitle')}</p>
        </div>
      </section>

      <section className="container grid gap-10 py-16 lg:grid-cols-2">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">{t('contact.info')}</h2>
          <p className="text-muted-foreground">{t('contact.infoLead')}</p>
          <div className="space-y-4">
            {CONTACTS.map((c) => (
              <div key={c.label} className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><c.icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="font-medium">{c.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {sent ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <h3 className="text-xl font-semibold">{t('contact.sentTitle')}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t('contact.sentBody')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="name">{t('contact.name')}</Label><Input id="name" required /></div>
                  <div className="space-y-2"><Label htmlFor="email">{t('contact.email')}</Label><Input id="email" type="email" required /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="subject">{t('contact.subject')}</Label><Input id="subject" /></div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t('contact.message')}</Label>
                  <textarea id="message" rows={5} required className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <Button type="submit" className="w-full">{t('contact.send')}</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
