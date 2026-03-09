import { Home, Package, Calendar, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: '홈' },
  { path: '/packages', icon: Package, label: '시술권' },
  { path: '/calendar', icon: Calendar, label: '캘린더' },
  { path: '/profile', icon: User, label: '마이' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-card/95 backdrop-blur-xl border-t border-border/50 safe-bottom">
      <div className="flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition-all duration-200 tap-target',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground active:text-foreground'
              )}
            >
              <item.icon className={cn('h-[22px] w-[22px]', isActive && 'stroke-[2.5]')} />
              <span className={cn('text-[10px] font-medium', isActive && 'font-bold')}>{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-0 w-5 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;