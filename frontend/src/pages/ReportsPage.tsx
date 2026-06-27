import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { downloadCsv } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { api } from '@/lib/api';
import { canExport, canViewReport } from '@/lib/permissions';
import { useRole } from '@/store/session';

const ALL = [
  { key: 'products', label: 'Products' },
  { key: 'customers', label: 'Customers' },
  { key: 'suppliers', label: 'Suppliers' },
  { key: 'purchases', label: 'Purchases' },
  { key: 'sales', label: 'Sales' },
];

export function ReportsPage() {
  const { t } = useTranslation();
  const role = useRole();
  const available = ALL.filter((r) => canViewReport(role, r.key));
  const [active, setActive] = useState(available[0]?.key ?? 'products');
  const { data, isLoading } = useQuery({
    queryKey: ['report', active],
    queryFn: () => api.get<{ data: Record<string, unknown>[] }>(`/reports/${active}`),
    enabled: available.some((r) => r.key === active),
  });
  const rows = data?.data ?? [];
  const headers = rows.length ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('modules.reports.title')}
        description={t('modules.reports.desc')}
        breadcrumb={[{ label: 'Reports' }]}
        actions={canExport(role) && <Button variant="outline" className="gap-2" disabled={!rows.length} onClick={() => downloadCsv(rows, `${active}-report.csv`)}><Download className="h-4 w-4" /> Export CSV</Button>}
      />
      <div className="flex flex-wrap gap-2">
        {available.map((r) => (
          <Button key={r.key} size="sm" variant={active === r.key ? 'default' : 'outline'} onClick={() => setActive(r.key)}>{r.label}</Button>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead><TR>{headers.map((h) => <TH key={h}>{h.replace(/_/g, ' ')}</TH>)}</TR></THead>
            <TBody>
              {isLoading ? <TR><TD className="py-8 text-center text-muted-foreground">Loading…</TD></TR>
                : rows.length ? rows.map((row, i) => <TR key={i}>{headers.map((h) => <TD key={h}>{String(row[h] ?? '—')}</TD>)}</TR>)
                  : <TR><TD className="py-8 text-center text-muted-foreground">No data</TD></TR>}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
