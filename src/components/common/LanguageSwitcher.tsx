import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Globe } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import type { SupportedLanguage } from '../../i18n';

interface LangMeta {
  /** Native-language label shown in bold. */
  native: string;
  /** Two-letter regional indicator emoji flag. */
  flag: string;
}

const LANGS: Record<SupportedLanguage, LangMeta> = {
  tr: { native: 'Türkçe',  flag: '🇹🇷' },
  en: { native: 'English', flag: '🇬🇧' },
  de: { native: 'Deutsch', flag: '🇩🇪' },
};

export default function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, setLanguage, supported } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click and Escape.
  useEffect(() => {
    if (!open) return;
    const onClickAway = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClickAway);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('mousedown', onClickAway);
      window.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const current = LANGS[language];

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('common.language')}
        className={`group inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold tracking-tight transition-all duration-150 ${
          open
            ? 'bg-white/15 text-white'
            : 'text-slate-300 hover:text-white hover:bg-white/10'
        }`}
      >
        <Globe className={`w-3.5 h-3.5 transition-colors ${open ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
        <span className="leading-none">{current.flag}</span>
        <span className="leading-none uppercase text-[10px] tracking-[0.08em] text-slate-400 group-hover:text-slate-200">
          {language}
        </span>
      </button>

      {/* Popover */}
      {open && (
        <div
          role="listbox"
          aria-label={t('common.language')}
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-2xl shadow-slate-900/30 ring-1 ring-slate-900/5 overflow-hidden z-50 animate-language-popover"
        >
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              {t('common.language')}
            </p>
          </div>
          <ul className="py-1">
            {supported.map((lang) => {
              const meta = LANGS[lang];
              const active = lang === language;
              return (
                <li key={lang}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setLanguage(lang);
                      setOpen(false);
                    }}
                    className={`group/item flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      active
                        ? 'bg-slate-50'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <span className="text-base leading-none">{meta.flag}</span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-sm ${active ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'}`}>
                        {meta.native}
                      </span>
                      <span className="block text-[10px] uppercase tracking-[0.12em] text-slate-400">
                        {lang}
                      </span>
                    </span>
                    {active && (
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" strokeWidth={2.5} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <style>{`
        @keyframes language-popover-in {
          from {
            opacity: 0;
            transform: scale(0.94) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-language-popover {
          animation: language-popover-in 140ms cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: top right;
        }
      `}</style>
    </div>
  );
}
