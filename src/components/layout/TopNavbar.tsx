import React from 'react';
import { Search, Bell, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface TopNavbarProps {
  title: string;
  onMenuClick: () => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ title, onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name
    ?.split(' ')
    .map((x) => x[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'DU';

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center px-4 md:px-6 gap-4">
      {/* Mobile menu button */}
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="w-5 h-5" />
      </Button>

      {/* Page title */}
      <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-secondary rounded-xl px-3 py-2 w-64">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search leads..."
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
        />
      </div>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="w-5 h-5 text-muted-foreground" />
        <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          logout();
          navigate('/login');
        }}
        title="Logout"
      >
        <LogOut className="w-4 h-4" />
      </Button>

      <button className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold flex-shrink-0">
        {initials}
      </button>
    </header>
  );
};

export default TopNavbar;
