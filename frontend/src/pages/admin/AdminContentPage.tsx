/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChevronDown, ImagePlus, Loader2, Plus, RotateCcw, Save, Search, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { applyContentOverrides } from '@/i18n';
import { bn as bnDefault, en as enDefault } from '@/i18n/translations';
import { api } from '@/lib/api';
import { uploadImage } from '@/lib/cloudinary';
import { flattenStrings, unflatten } from '@/lib/content';
import { useSiteContent, type ShowcaseItem } from '@/store/siteContent';

// Only the public marketing sections are editable.
const SECTIONS = ['home', 'features', 'about', 'contact', 'footer'] as const;
const pickSections = (src: any) => Object.fromEntries(SECTIONS.map((s) => [s, src[s]]));

const EN_DEFAULTS = flattenStrings(pickSections(enDefault));
const BN_DEFAULTS = flattenStrings(pickSections(bnDefault));
const PATHS = Object.keys(EN_DEFAULTS);

export function AdminContentPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'text' | 'products'>('text');
  const [loaded, setLoaded] = useState(false);
  const full = useRef<Record<string, any>>({}); // whole site_content.data (preserve keys across saves)
  const vals = useRef<{ en: Record<string, string>; bn: Record<string, string> }>({ en: {}, bn: {} });
  const [showcase, setShowcase] = useState<ShowcaseItem[]>([]);

  useEffect(() => {
    api.get<{ data: Record<string, any> }>('/admin/content').then((r) => {
      full.current = r.data ?? {};
      vals.current = { en: { ...EN_DEFAULTS, ...flattenStrings(full.current.en ?? {}) }, bn: { ...BN_DEFAULTS, ...flattenStrings(full.current.bn ?? {}) } };
      setShowcase(Array.isArray(full.current.showcase) ? full.current.showcase : []);
      setLoaded(true);
    }).catch(() => { full.current = {}; vals.current = { en: { ...EN_DEFAULTS }, bn: { ...BN_DEFAULTS } }; setLoaded(true); });
  }, []);

  if (!loaded) return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{t('admin.content.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.content.subtitle')}</p>
      </div>

      <div className="flex gap-2">
        {(['text', 'products'] as const).map((tb) => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === tb ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
            {t(`admin.content.tabs.${tb}`)}
          </button>
        ))}
      </div>

      {tab === 'text'
        ? <TextEditor full={full} vals={vals} />
        : <ProductsEditor full={full} showcase={showcase} setShowcase={setShowcase} />}
    </div>
  );
}

// ── Page text editor (EN + বাংলা) ────────────────────────────────────────────
function TextEditor({ full, vals }: { full: React.MutableRefObject<Record<string, any>>; vals: React.MutableRefObject<{ en: Record<string, string>; bn: Record<string, string> }> }) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({ home: true });
  const [version, setVersion] = useState(0);

  const save = async () => {
    setSaving(true);
    try {
      const data = { ...full.current, en: unflatten(vals.current.en), bn: unflatten(vals.current.bn) };
      await api.put('/admin/content', { data });
      full.current = data;
      applyContentOverrides({ en: data.en, bn: data.bn });
      toast.success(t('admin.content.saved'));
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    if (!confirm(t('admin.content.resetConfirm'))) return;
    setSaving(true);
    try {
      // drop text overrides, keep everything else (e.g. showcase)
      const { en: _en, bn: _bn, ...rest } = full.current;
      void _en; void _bn;
      await api.put('/admin/content', { data: rest });
      full.current = rest;
      vals.current = { en: { ...EN_DEFAULTS }, bn: { ...BN_DEFAULTS } };
      applyContentOverrides({ en: unflatten(EN_DEFAULTS), bn: unflatten(BN_DEFAULTS) });
      setVersion((v) => v + 1);
      toast.success(t('admin.content.resetDone'));
    } finally { setSaving(false); }
  };

  const query = q.trim().toLowerCase();
  const visible = query ? PATHS.filter((p) => p.toLowerCase().includes(query) || (vals.current.en[p] ?? '').toLowerCase().includes(query)) : PATHS;
  const grouped = SECTIONS.map((s) => ({ section: s, paths: visible.filter((p) => p === s || p.startsWith(`${s}.`)) })).filter((g) => g.paths.length);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={t('admin.content.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={reset} disabled={saving}><RotateCcw className="h-4 w-4" /> {t('admin.content.reset')}</Button>
          <Button size="sm" className="gap-1.5" onClick={save} disabled={saving}><Save className="h-4 w-4" /> {saving ? t('common.loading') : t('admin.content.save')}</Button>
        </div>
      </div>

      {grouped.map(({ section, paths }) => {
        const isOpen = query ? true : (open[section] ?? false);
        return (
          <Card key={`${section}-${version}`} className="overflow-hidden">
            <button type="button" onClick={() => setOpen((o) => ({ ...o, [section]: !isOpen }))}
              className="flex w-full items-center justify-between px-5 py-4 text-left">
              <span className="font-semibold capitalize">{section} <span className="ml-2 text-xs font-normal text-muted-foreground">{paths.length} {t('admin.content.fields')}</span></span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="space-y-4 border-t p-5">
                <div className="hidden grid-cols-[180px_1fr_1fr] gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:grid">
                  <span>{t('admin.content.field')}</span><span>{t('admin.content.english')}</span><span>{t('admin.content.bangla')}</span>
                </div>
                {paths.map((path) => (
                  <div key={path} className="grid gap-2 sm:grid-cols-[180px_1fr_1fr] sm:items-start">
                    <code className="break-all pt-2 text-[11px] text-muted-foreground">{path.replace(`${section}.`, '')}</code>
                    <textarea rows={2} defaultValue={vals.current.en[path] ?? ''}
                      onChange={(e) => { vals.current.en[path] = e.target.value; }}
                      className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                    <textarea rows={2} defaultValue={vals.current.bn[path] ?? vals.current.en[path] ?? ''}
                      onChange={(e) => { vals.current.bn[path] = e.target.value; }}
                      className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={save} disabled={saving}><Save className="h-4 w-4" /> {saving ? t('common.loading') : t('admin.content.save')}</Button>
      </div>
    </div>
  );
}

// ── Homepage product showcase (images shown on the public homepage) ───────────
function ProductsEditor({ full, showcase, setShowcase }: { full: React.MutableRefObject<Record<string, any>>; showcase: ShowcaseItem[]; setShowcase: (s: ShowcaseItem[]) => void }) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setShowcase([...showcase, { url, name: '' }]);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Upload failed'); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ''; }
  };
  const rename = (i: number, name: string) => setShowcase(showcase.map((s, idx) => (idx === i ? { ...s, name } : s)));
  const remove = (i: number) => setShowcase(showcase.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    try {
      const data = { ...full.current, showcase };
      await api.put('/admin/content', { data });
      full.current = data;
      useSiteContent.getState().setShowcase(showcase);
      toast.success(t('admin.content.productsSaved'));
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">{t('admin.content.productsHint')}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t('admin.content.addImage')}
          </Button>
          <Button size="sm" className="gap-1.5" onClick={save} disabled={saving}><Save className="h-4 w-4" /> {saving ? t('common.loading') : t('admin.content.save')}</Button>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }} />

      {showcase.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center text-muted-foreground">
          <ImagePlus className="h-8 w-8" />
          <p className="text-sm">{t('admin.content.noProducts')}</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {showcase.map((p, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="relative">
                <img src={p.url} alt="" className="h-40 w-full object-cover" />
                <button onClick={() => remove(i)} className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-destructive shadow hover:bg-background" aria-label="Remove">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="p-3">
                <Input placeholder={t('admin.content.productName')} value={p.name ?? ''} onChange={(e) => rename(i, e.target.value)} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
