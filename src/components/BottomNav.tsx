import { Home, Package, User, ClipboardList, CalendarDays, Stethoscope } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (['/signup', '/farewell'].includes(location.pathname)) return null;
  // 어드민 페이지에서는 모바일 하단 네비 숨김 (데스크톱 UI)
  if (location.pathname.startsWith('/admin')) return null;

  // 5-item nav with Calendar as the centered highlight
  const navItems = [
    { path: '/', icon: Home, label: t('nav_home'), highlight: false },
    { path: '/treatments', icon: Stethoscope, label: '시술', highlight: false },
    { path: '/calendar', icon: CalendarDays, label: '캘린더', highlight: true },
    { path: '/calendar?tab=history', icon: ClipboardList, label: '시술내역', highlight: false, matchPath: '/calendar', matchSearch: 'tab=history' },
    { path: '/profile', icon: User, label: t('nav_my'), highlight: false },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const isItemActive = (item: typeof navItems[number]) => {
    if (item.matchPath && item.matchSearch) {
      return location.pathname === item.matchPath && location.search.includes(item.matchSearch);
    }
    if (item.path === '/calendar') {
      return location.pathname === '/calendar' && !location.search.includes('tab=history');
    }
    return location.pathname === item.path;
  };

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-card/95 backdrop-blur-xl border-t border-border/50 safe-bottom">
        <div className="flex items-end justify-around px-2 py-1.5">
          {navItems.map((item) => {
            const isActive = isItemActive(item);
            if (item.highlight) {
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className="relative flex flex-col items-center -mt-5 tap-target"
                >
                  <div className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center shadow-lg ring-4 ring-background transition-all',
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/90 text-primary-foreground'
                  )}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className={cn('mt-0.5 text-[10px] font-bold', isActive ? 'text-primary' : 'text-muted-foreground')}>
                    {item.label}
                  </span>
                </button>
              );
            }
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200 tap-target',
                  isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground'
                )}
              >
                <item.icon className={cn('h-[22px] w-[22px]', isActive && 'stroke-[2.5]')} />
                <span className={cn('text-[10px] font-medium', isActive && 'font-bold')}>{item.label}</span>
              </button>
            );
          })}
        </div>
    </nav>
  );
};

export default BottomNav;
