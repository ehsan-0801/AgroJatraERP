import { Building2, Boxes, DollarSign, ShoppingCart, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n || 0);
const money = (n: number) => `৳${fmt(n)}`;

function Kpi({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────
export function AdminOverviewPage() {
  const { t } = useTranslation();
  const [d, setD] = useState<Record<string, number> | null>(null);
  useEffect(() => { api.get<{ totals: Record<string, number> }>('/admin/overview').then((r) => setD(r.totals)).catch(() => setD(null)); }, []);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{t('admin.overview.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.overview.subtitle')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi icon={Building2} label={t('admin.overview.organizations')} value={fmt(d?.organizations ?? 0)} />
        <Kpi icon={UsersRound} label={t('admin.overview.users')} value={fmt(d?.users ?? 0)} />
        <Kpi icon={Boxes} label={t('admin.overview.products')} value={fmt(d?.products ?? 0)} />
        <Kpi icon={ShoppingCart} label={t('admin.overview.sales')} value={fmt(d?.sales ?? 0)} />
        <Kpi icon={DollarSign} label={t('admin.overview.revenue')} value={money(d?.revenue ?? 0)} />
      </div>
    </div>
  );
}

// ── Organizations list ───────────────────────────────────────────────────────
interface OrgRow { id: string; name: string; owner_email: string; owner_name: string; members: number; products: number; sales: number; revenue: number; created_at: string; }
export function AdminOrganizationsPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<OrgRow[] | null>(null);
  useEffect(() => { api.get<{ data: OrgRow[] }>('/admin/organizations').then((r) => setRows(r.data)).catch(() => setRows([])); }, []);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{t('admin.nav.organizations')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.orgs.subtitle')}</p>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t('admin.orgs.name')}</th>
                <th className="px-4 py-3">{t('admin.orgs.owner')}</th>
                <th className="px-4 py-3 text-right">{t('admin.orgs.members')}</th>
                <th className="px-4 py-3 text-right">{t('admin.orgs.products')}</th>
                <th className="px-4 py-3 text-right">{t('admin.orgs.sales')}</th>
                <th className="px-4 py-3 text-right">{t('admin.orgs.revenue')}</th>
              </tr>
            </thead>
            <tbody>
              {rows?.map((o) => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-accent/40">
                  <td className="px-4 py-3 font-medium"><Link to={`/admin/organizations/${o.id}`} className="hover:text-primary hover:underline">{o.name}</Link></td>
                  <td className="px-4 py-3 text-muted-foreground">{o.owner_email}</td>
                  <td className="px-4 py-3 text-right">{o.members}/5</td>
                  <td className="px-4 py-3 text-right">{o.products}</td>
                  <td className="px-4 py-3 text-right">{o.sales}</td>
                  <td className="px-4 py-3 text-right font-medium">{money(o.revenue)}</td>
                </tr>
              ))}
              {rows && rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">{t('common.noRecords')}</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── Organization detail ──────────────────────────────────────────────────────
interface OrgDetail {
  organization: { id: string; name: string; phone?: string; email?: string; address?: string; created_at: string };
  members: { id: string; email: string; full_name: string; role: string; status: string; is_owner: boolean }[];
  counts: Record<string, number>;
  recentSales: { id: string; invoice_no: string; total: number; sale_date: string; customer_name: string }[];
}
export function AdminOrganizationDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [d, setD] = useState<OrgDetail | null>(null);
  useEffect(() => { if (id) api.get<{ data: OrgDetail }>(`/admin/organizations/${id}`).then((r) => setD(r.data)).catch(() => setD(null)); }, [id]);
  if (!d) return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>;
  const c = d.counts;
  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/organizations" className="text-sm text-primary hover:underline">← {t('admin.nav.organizations')}</Link>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">{d.organization.name}</h1>
        <p className="text-sm text-muted-foreground">{[d.organization.email, d.organization.phone, d.organization.address].filter(Boolean).join(' · ')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {(['products', 'categories', 'customers', 'suppliers', 'purchases', 'sales'] as const).map((k) => (
          <Card key={k} className="p-4"><p className="text-xs text-muted-foreground capitalize">{k}</p><p className="text-xl font-bold">{fmt(c[k] ?? 0)}</p></Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="mb-3 font-semibold">{t('admin.detail.members')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-muted-foreground">
              <tr><th className="py-2 pr-4">{t('members.email')}</th><th className="py-2 pr-4">{t('members.name')}</th><th className="py-2 pr-4">{t('members.role')}</th><th className="py-2">{t('members.status')}</th></tr>
            </thead>
            <tbody>
              {d.members.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{m.email}</td>
                  <td className="py-2 pr-4">{m.full_name ?? '—'}</td>
                  <td className="py-2 pr-4">{t(`roles.${m.role}`)}{m.is_owner && <span className="ml-1 text-xs text-primary">({t('members.owner')})</span>}</td>
                  <td className="py-2">{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 font-semibold">{t('admin.detail.recentSales')}</h2>
        {d.recentSales.length === 0 ? <p className="text-sm text-muted-foreground">{t('common.noRecords')}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {d.recentSales.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{s.invoice_no}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{s.customer_name ?? '—'}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{s.sale_date?.slice(0, 10)}</td>
                    <td className="py-2 text-right font-medium">{money(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Central data (Products / Categories / … across all orgs) ─────────────────
type Row = Record<string, string | number | null> & { id: string; organization_name: string };
const ENTITY_TABS = ['products', 'categories', 'customers', 'suppliers'] as const;
type Entity = (typeof ENTITY_TABS)[number];

const COLUMNS: Record<Entity, { key: string; label: string; align?: 'right'; fmt?: (v: never) => string }[]> = {
  products: [
    { key: 'name', label: 'Name' }, { key: 'sku', label: 'SKU' }, { key: 'category', label: 'Category' },
    { key: 'stock', label: 'Stock', align: 'right' }, { key: 'selling_price', label: 'Price', align: 'right', fmt: (v) => money(Number(v)) }, { key: 'status', label: 'Status' },
  ],
  categories: [
    { key: 'name', label: 'Name' }, { key: 'products', label: 'Products', align: 'right' }, { key: 'description', label: 'Description' },
  ],
  customers: [
    { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' }, { key: 'outstanding_due', label: 'Due', align: 'right', fmt: (v) => money(Number(v)) },
  ],
  suppliers: [
    { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' },
  ],
};

export function AdminDataPage() {
  const { t } = useTranslation();
  const [entity, setEntity] = useState<Entity>('products');
  const [org, setOrg] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => { api.get<{ data: OrgRow[] }>('/admin/organizations').then((r) => setOrgs(r.data.map((o) => ({ id: o.id, name: o.name })))).catch(() => setOrgs([])); }, []);
  useEffect(() => {
    setRows(null);
    const qs = org ? `?organization_id=${org}` : '';
    api.get<{ data: Row[] }>(`/admin/data/${entity}${qs}`).then((r) => setRows(r.data)).catch(() => setRows([]));
  }, [entity, org]);

  const cols = COLUMNS[entity];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{t('admin.data.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.data.subtitle')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {ENTITY_TABS.map((e) => (
            <button key={e} onClick={() => setEntity(e)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${entity === e ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {t(`admin.data.${e}`)}
            </button>
          ))}
        </div>
        <select value={org} onChange={(e) => setOrg(e.target.value)}
          className="ml-auto rounded-lg border bg-background px-3 py-1.5 text-sm">
          <option value="">{t('admin.data.allOrgs')}</option>
          {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t('admin.data.organization')}</th>
                {cols.map((c) => <th key={c.key} className={`px-4 py-3 ${c.align === 'right' ? 'text-right' : ''}`}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows === null && <tr><td colSpan={cols.length + 1} className="px-4 py-10 text-center text-muted-foreground">{t('common.loading')}</td></tr>}
              {rows?.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-accent/40">
                  <td className="px-4 py-3"><span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{r.organization_name}</span></td>
                  {cols.map((c) => (
                    <td key={c.key} className={`px-4 py-3 ${c.align === 'right' ? 'text-right' : ''}`}>
                      {r[c.key] == null || r[c.key] === '' ? '—' : c.fmt ? c.fmt(r[c.key] as never) : String(r[c.key])}
                    </td>
                  ))}
                </tr>
              ))}
              {rows && rows.length === 0 && <tr><td colSpan={cols.length + 1} className="px-4 py-10 text-center text-muted-foreground">{t('common.noRecords')}</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── Users (platform-wide) ────────────────────────────────────────────────────
interface AdminUser { id: string; email: string; full_name: string; is_super_admin: boolean; memberships: { organization: string; role: string }[]; }
export function AdminUsersPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<AdminUser[] | null>(null);
  useEffect(() => { api.get<{ data: AdminUser[] }>('/admin/users').then((r) => setRows(r.data)).catch(() => setRows([])); }, []);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{t('admin.nav.users')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.users.subtitle')}</p>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-3">{t('members.email')}</th><th className="px-4 py-3">{t('members.name')}</th><th className="px-4 py-3">{t('admin.users.orgs')}</th></tr>
            </thead>
            <tbody>
              {rows?.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{u.email}{u.is_super_admin && <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">{t('admin.badge')}</span>}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.memberships.length === 0 ? '—' : u.memberships.map((m, i) => <span key={i} className="mr-2 whitespace-nowrap">{m.organization} <span className="text-xs">({t(`roles.${m.role}`)})</span></span>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
