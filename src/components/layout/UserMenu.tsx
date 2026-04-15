import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/** Avatar-triggered dropdown containing the user's name, settings link, and
 *  logout. Pulled out of ManagerTopNav so the horizontal bar stays reserved
 *  for core navigation (Dashboard/Trucks/Drivers/Clients/Fuel). */
export default function UserMenu() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  const initials = user?.name
    ? user.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
        aria-label={t('common.account', { defaultValue: 'Hesap' }) as string}
        aria-expanded={open}>
        <span className="w-7 h-7 rounded-full bg-primary-500/20 text-primary-200 flex items-center justify-center text-xs font-bold">
          {initials}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl shadow-black/10 border border-gray-200 overflow-hidden z-40 animate-[fadeIn_140ms_ease-out]">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.name ?? '—'}
            </p>
          </div>
          <div className="py-1">
            <NavLink
              to="/manager/settings"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`
              }>
              <Settings className="w-4 h-4" />
              <span>{t('nav.settings', { defaultValue: 'Ayarlar' })}</span>
            </NavLink>
          </div>
          <div className="border-t border-gray-100 py-1">
            <button
              type="button"
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" />
              <span>{t('common.logout', { defaultValue: 'Çıkış' })}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
