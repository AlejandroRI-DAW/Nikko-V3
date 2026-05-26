import { Outlet, Link, useLocation } from 'react-router';
import { MessageCircle, Home, AlertCircle, BookOpen, User } from 'lucide-react';

export function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/app', icon: MessageCircle, label: 'Chat' },
    { path: '/app/dashboard', icon: Home, label: 'Inicio' },
    { path: '/app/emergency', icon: AlertCircle, label: 'Ayuda' },
    { path: '/app/resources', icon: BookOpen, label: 'Recursos' },
    { path: '/app/profile', icon: User, label: 'Perfil' },
  ];

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex w-20 flex-col items-center py-6 gap-6 border-r" style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-secondary)'
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="group flex flex-col items-center gap-1 transition-all"
            >
              <div
                className="p-3 rounded-2xl transition-all"
                style={{
                  background: active ? 'var(--color-primary)' : 'transparent',
                  color: active ? 'var(--color-surface)' : 'var(--color-text-secondary)',
                }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <span
                className="text-xs text-center"
                style={{
                  color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t" style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-secondary)'
      }}>
        <div className="flex justify-around items-center h-20 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-1 transition-all flex-1"
              >
                <div
                  className="p-2 rounded-xl transition-all"
                  style={{
                    background: active ? 'var(--color-primary)' : 'transparent',
                    color: active ? 'var(--color-surface)' : 'var(--color-text-secondary)',
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className="text-xs text-center"
                  style={{
                    color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
