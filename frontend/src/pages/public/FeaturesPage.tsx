import {
  BarChart3,
  Boxes,
  FileText,
  LayoutDashboard,
  Lock,
  Moon,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const SECTIONS = [
  { icon: LayoutDashboard, title: 'Smart Dashboard', points: ['8 real-time KPIs', 'Sales & purchase trends', 'Top selling products', 'Recent activity feed'] },
  { icon: Boxes, title: 'Product Management', points: ['SKU & barcode tracking', 'Purchase & selling prices', 'Stock & min-stock alerts', 'Search, filter, paginate'] },
  { icon: ShoppingCart, title: 'Purchases', points: ['Multi line-item entry', 'Supplier selection', 'Tax & discount', 'Automatic stock increase'] },
  { icon: BarChart3, title: 'Sales & Invoicing', points: ['Stock validation', 'Automatic stock deduction', 'Invoice numbers', 'Customer dues tracking'] },
  { icon: Users, title: 'Customers', points: ['Full CRUD', 'Outstanding due', 'Purchase history', 'Quick search'] },
  { icon: Truck, title: 'Suppliers', points: ['Full CRUD', 'Contact details', 'Purchase history', 'Quick search'] },
  { icon: FileText, title: 'Reports', points: ['Products, sales, purchases', 'Customer & supplier reports', 'CSV export', 'Print-friendly'] },
  { icon: Lock, title: 'Security', points: ['Supabase authentication', 'Protected routes', 'Row Level Security', 'Soft deletes'] },
  { icon: Moon, title: 'Experience', points: ['Dark / light / system theme', 'Responsive on any device', 'Clean modern SaaS UI', 'Fast & accessible'] },
];

export function FeaturesPage() {
  return (
    <>
      <section className="border-b bg-gradient-to-b from-emerald-50 to-background">
        <div className="container max-w-2xl py-20 text-center">
          <h1 className="text-4xl font-bold">Features</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to run and grow your business — in one platform.
          </p>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <Card key={s.title}>
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <ul className="mt-3 space-y-1.5">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Button size="lg" asChild>
            <Link to="/register">Start using AgroJatra ERP</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
