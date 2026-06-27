import { useTranslation } from 'react-i18next';
import { setLanguage } from '@/i18n';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'bn' ? 'bn' : 'en';
  return (
    <div className={cn('inline-flex items-center rounded-full border bg-background p-0.5 text-xs font-semibold', className)}>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={cn('rounded-full px-2.5 py-1 transition-colors', lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('bn')}
        className={cn('rounded-full px-2.5 py-1 transition-colors', lang === 'bn' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
      >
        বাংলা
      </button>
    </div>
  );
}
