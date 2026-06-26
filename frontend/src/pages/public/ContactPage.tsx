import { Mail, MapPin, Phone } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CONTACTS = [
  { icon: Mail, label: 'Email', value: 'hello@agrojatra.com' },
  { icon: Phone, label: 'Phone', value: '+880 1XXX-XXXXXX' },
  { icon: MapPin, label: 'Location', value: 'Dhaka, Bangladesh' },
];

export function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    toast.success('Thanks! We will get back to you soon.');
  };

  return (
    <>
      <section className="border-b bg-gradient-to-b from-emerald-50 to-background">
        <div className="container max-w-2xl py-20 text-center">
          <h1 className="text-4xl font-bold">Get in touch</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Questions about AgroJatra ERP? We'd love to hear from you.
          </p>
        </div>
      </section>

      <section className="container grid gap-10 py-16 lg:grid-cols-2">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Contact information</h2>
          <p className="text-muted-foreground">
            Reach out and our team will respond as soon as possible.
          </p>
          <div className="space-y-4">
            {CONTACTS.map((c) => (
              <div key={c.label} className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <c.icon className="h-5 w-5" />
                </div>
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
                <h3 className="text-xl font-semibold">Message sent 🎉</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Thank you for reaching out. We'll be in touch shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    rows={5}
                    required
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Send message
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
