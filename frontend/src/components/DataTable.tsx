import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  empty,
  onRowClick,
  page,
  pages,
  total,
  onPage,
}: {
  columns: Column<T>[];
  rows?: T[];
  loading?: boolean;
  empty?: string;
  onRowClick?: (row: T) => void;
  page?: number;
  pages?: number;
  total?: number;
  onPage?: (p: number) => void;
}) {
  const { t } = useTranslation();
  const emptyText = empty ?? t('common.noRecords');
  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                {columns.map((c) => (
                  <TH key={c.header} className={c.className}>{c.header}</TH>
                ))}
              </TR>
            </THead>
            <TBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TR key={`sk-${i}`}>
                    {columns.map((c) => (
                      <TD key={c.header} className={c.className}>
                        <Skeleton className={cn('h-4', c.className?.includes('text-right') ? 'ml-auto w-16' : 'w-28')} />
                      </TD>
                    ))}
                  </TR>
                ))
              ) : rows?.length ? (
                rows.map((row) => (
                  <TR
                    key={row.id}
                    className={cn(onRowClick && 'cursor-pointer')}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((c) => (
                      <TD key={c.header} className={c.className}>{c.render(row)}</TD>
                    ))}
                  </TR>
                ))
              ) : (
                <TR><TD colSpan={columns.length} className="py-8 text-center text-muted-foreground">{emptyText}</TD></TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      {pages !== undefined && pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('common.page')} {page} {t('common.of')} {pages} · {total} {t('common.total')}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={(page ?? 1) <= 1} onClick={() => onPage?.((page ?? 1) - 1)}>{t('common.previous')}</Button>
            <Button variant="outline" size="sm" disabled={(page ?? 1) >= pages} onClick={() => onPage?.((page ?? 1) + 1)}>{t('common.next')}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Download an array of flat objects as CSV. */
export function downloadCsv(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
