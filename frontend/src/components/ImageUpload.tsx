import { ImagePlus, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

/** Local image picker. Holds the chosen File in the parent (no upload yet) and
 *  shows a preview; the actual Cloudinary upload happens on form save. */
export function ImageUpload({
  value, file, onSelect, onRemove, uploading, className,
}: {
  value?: string | null;      // existing (already-uploaded) URL
  file: File | null;          // newly picked file (not uploaded yet)
  onSelect: (file: File | null) => void;
  onRemove: () => void;       // clear both file and existing value
  uploading?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = preview ?? value ?? null;

  return (
    <div className={className}>
      <div className="flex items-center gap-4">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/40">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : shown ? (
            <img src={shown} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
          )}
          {shown && !uploading && (
            <button type="button" onClick={() => { onRemove(); if (inputRef.current) inputRef.current.value = ''; }}
              className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-destructive shadow hover:bg-background" aria-label="Remove">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="space-y-1">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            {shown ? t('image.change') : t('image.upload')}
          </Button>
          <p className="text-xs text-muted-foreground">{t('image.hint')}</p>
        </div>
      </div>
      <input
        ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0] ?? null; if (f) onSelect(f); }}
      />
    </div>
  );
}
