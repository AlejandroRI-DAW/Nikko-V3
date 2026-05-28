import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { MessageCircle, Home, AlertCircle, BookOpen, User, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);

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

  const handleLogout = () => {
    localStorage.removeItem('nikko-nickname');
    navigate('/');
  };

  const toggleHistorySidebar = () => {
    const nextOpen = !isHistorySidebarOpen;
    setIsHistorySidebarOpen(nextOpen);
    window.dispatchEvent(new CustomEvent('nikko-history-sidebar-toggle', { detail: { open: nextOpen } }));
  };

  useEffect(() => {
    const syncHistorySidebar = (event: Event) => {
      const nextOpen = (event as CustomEvent<{ open?: boolean }>).detail?.open;
      if (typeof nextOpen === 'boolean') {
        setIsHistorySidebarOpen(nextOpen);
      }
    };

    window.addEventListener('nikko-history-sidebar-toggle', syncHistorySidebar);
    return () => window.removeEventListener('nikko-history-sidebar-toggle', syncHistorySidebar);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/app') {
      setIsHistorySidebarOpen(false);
    }
  }, [location.pathname]);

  return (
    <div className="flex flex-col md:flex-row h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex w-20 flex-col items-center py-6 gap-6 border-r" style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-secondary)'
      }}>
        <div
          className="relative z-30 overflow-visible transition-[max-height,opacity,transform] duration-300 ease-out"
          style={{
            maxHeight: location.pathname === '/app' && !isHistorySidebarOpen ? '6rem' : '0rem',
            opacity: location.pathname === '/app' && !isHistorySidebarOpen ? 1 : 0,
            transform: location.pathname === '/app' && !isHistorySidebarOpen ? 'translateY(0)' : 'translateY(-8px)',
            pointerEvents: location.pathname === '/app' && !isHistorySidebarOpen ? 'auto' : 'none',
          }}
          aria-hidden={location.pathname !== '/app' || isHistorySidebarOpen}
        >
          <button
            type="button"
            onClick={toggleHistorySidebar}
            className="group flex flex-col items-center gap-1 pt-1 transition-all"
            title={isHistorySidebarOpen ? 'Cerrar barra lateral' : 'Abrir barra lateral'}
          >
            <div
              className="p-3 rounded-2xl transition-all duration-200 ease-out group-hover:-translate-y-1 group-hover:scale-105"
              style={{
                background: 'var(--color-background)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-secondary)',
              }}
            >
              {isHistorySidebarOpen ? (
                <PanelLeftClose className="w-6 h-6" />
              ) : (
                <PanelLeftOpen className="w-6 h-6" />
              )}
            </div>
            <span
              className="text-xs text-center transition-opacity duration-200"
              style={{
                color: 'var(--color-text-secondary)',
                opacity: 1,
              }}
            >
              Historial
            </span>
          </button>
        </div>
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
                className="p-3 rounded-2xl transition-all duration-200 ease-out group-hover:-translate-y-1 group-hover:scale-105"
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
        <button
          type="button"
          onClick={handleLogout}
          className="mt-auto group flex flex-col items-center gap-1 transition-all"
          title="Cerrar sesion"
        >
          <div
            className="p-3 rounded-2xl transition-all duration-200 ease-out group-hover:-translate-y-1 group-hover:scale-105"
            style={{
              background: 'rgba(220, 38, 38, 0.18)',
              color: '#F87171',
            }}
          >
            <LogOut className="w-6 h-6" />
          </div>
          <span className="text-xs text-center" style={{ color: '#F87171' }}>
            Salir
          </span>
        </button>
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
                  className="p-2 rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105"
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
