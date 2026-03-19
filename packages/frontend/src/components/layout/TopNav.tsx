import { Menu, Moon, Sun, LogOut } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

export function TopNav() {
  const { theme, setTheme, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1.5 hover:bg-muted"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm text-muted-foreground">MLOps Platform</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="rounded-md p-1.5 hover:bg-muted"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {user && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <button
              onClick={logout}
              className={cn('rounded-md p-1.5 hover:bg-muted')}
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
