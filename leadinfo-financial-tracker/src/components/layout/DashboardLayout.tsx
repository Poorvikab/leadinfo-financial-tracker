import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useActivity } from '@/context/ActivityContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ArrowLeftRight,  // ✅ unified transactions icon
  PiggyBank,
  FileText,
  Settings,
  Menu,
  X,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ActivityAction, ActivityLog } from '@/context/ActivityContext';

const getActionColorClasses = (action: ActivityAction) => {
  switch (action) {
    case 'added':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30', dot: 'bg-emerald-500' };
    case 'updated':
      return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30', dot: 'bg-amber-500' };
    case 'deleted':
      return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30', dot: 'bg-red-500' };
    case 'imported':
      return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30', dot: 'bg-blue-500' };
    default:
      return { bg: 'bg-[var(--color-surface-highlight)]', text: 'text-[var(--color-text-secondary)]', border: 'border-[var(--color-border)]', dot: 'bg-[var(--color-text-secondary)]' };
  }
};

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile: boolean;
  currentView: string;
  onNavigate: (view: string) => void;
}

const Sidebar = ({ isOpen, setIsOpen, isMobile, currentView, onNavigate }: SidebarProps) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ✅ Replaced 'Income' and 'Expenses' with single 'Transactions' entry
  const links = [
    { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
    { name: 'Transactions', icon: ArrowLeftRight, id: 'transactions' },
    { name: '401k Records', icon: PiggyBank, id: '401k' },
    { name: 'Reports', icon: FileText, id: 'reports' },
    { name: 'Settings', icon: Settings, id: 'settings' },
  ];

  const sidebarClass = cn(
    "fixed left-0 top-0 z-40 h-screen bg-[var(--color-surface)] border-r border-[var(--color-border)] transition-all duration-300 flex flex-col",
    isOpen ? "w-64" : "w-20",
    isMobile && !isOpen && "-translate-x-full"
  );

  return (
    <div className={sidebarClass}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--color-border)]">
        {isOpen ? (
          <span className="text-lg font-bold text-[var(--color-primary)] truncate">LeadInfo</span>
        ) : (
          <span className="text-lg font-bold text-[var(--color-primary)]">LI</span>
        )}
        {!isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </Button>
        )}
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X size={20} />
          </Button>
        )}
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-2">
          {links.map((link) => {
            const isActive = currentView === link.id;
            return (
              <button
                key={link.name}
                onClick={() => {
                  onNavigate(link.id);
                  if (isMobile) setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center px-3 py-2 rounded-md transition-colors group",
                  isActive
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] hover:text-[var(--color-text-primary)]"
                )}
              >
                <link.icon
                  size={20}
                  className={cn(
                    "shrink-0",
                    isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]"
                  )}
                />
                {isOpen && (
                  <span className="ml-3 text-sm font-medium whitespace-nowrap">{link.name}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-[var(--color-border)] relative">
        <div
          className={cn("flex items-center rounded-md p-2 transition-colors group relative", !isOpen && "justify-center")}
          onMouseEnter={() => setShowUserMenu(true)}
          onMouseLeave={() => setShowUserMenu(false)}
        >
          <div className="relative shrink-0">
            <div className="h-8 w-8 rounded-full bg-[var(--color-surface-highlight)] border border-[var(--color-border)] flex items-center justify-center group-hover:border-[var(--color-primary)] transition-colors">
              <User size={16} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)]" />
            </div>
          </div>

          {isOpen && (
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] truncate">Admin</p>
            </div>
          )}

          {showUserMenu && isOpen && (
            <div className="absolute inset-0 bg-[var(--color-surface)] flex items-center justify-center animate-in fade-in duration-200">
              <Button
                variant="destructive"
                size="sm"
                onClick={logout}
                className="w-full h-full rounded-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </Button>
            </div>
          )}

          {showUserMenu && !isOpen && (
            <div className="absolute left-full ml-2 top-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full p-2 shadow-xl z-50 animate-in fade-in slide-in-from-left-2">
              <button onClick={logout} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors" title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export default function DashboardLayout({ children, currentView, onNavigate }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();
  const { logs, isLoading, notification } = useActivity();
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const activityPanelRef = useRef<HTMLDivElement>(null);
  const activityButtonRef = useRef<HTMLButtonElement>(null);
  const [displayedNotifications, setDisplayedNotifications] = useState<(ActivityLog & { displayId: string })[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notification) {
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => { });
      } catch (_) { }

      const displayId = `${Date.now()}-${Math.random()}`;
      setDisplayedNotifications([{ ...notification, displayId }]);

      const timer = setTimeout(() => {
        setDisplayedNotifications((prev) => prev.filter((n) => n.displayId !== displayId));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setDisplayedNotifications([]);
      }
    };
    if (displayedNotifications.length > 0) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [displayedNotifications.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        activityPanelRef.current &&
        !activityPanelRef.current.contains(target) &&
        activityButtonRef.current &&
        !activityButtonRef.current.contains(target)
      ) {
        setShowActivityPanel(false);
      }
    };
    if (showActivityPanel) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActivityPanel]);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMobile(true);
        setIsSidebarOpen(false);
      } else {
        setIsMobile(false);
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      <div className="flex flex-1">
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          isMobile={isMobile}
          currentView={currentView}
          onNavigate={onNavigate}
        />

        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 min-h-screen",
          isSidebarOpen && !isMobile ? "ml-64" : isMobile ? "ml-0" : "ml-20"
        )}>
          <header className="h-16 sticky top-0 z-30 bg-[var(--color-background)]/80 backdrop-blur-md border-b border-[var(--color-border)] px-6 flex items-center justify-between">
            <div className="flex items-center">
              {isMobile && (
                <Button variant="ghost" size="icon" className="mr-4" onClick={() => setIsSidebarOpen(true)}>
                  <Menu size={20} />
                </Button>
              )}
              <div>
                <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Financial Tracker</h1>
                <p className="text-xs text-[var(--color-text-secondary)]">FY 2026</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 relative">
              <div className="relative">
                <Button
                  ref={activityButtonRef}
                  variant="ghost"
                  size="icon"
                  className="relative text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  onClick={() => setShowActivityPanel((prev) => !prev)}
                >
                  <Bell size={20} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-primary)] rounded-full" />
                </Button>

                {displayedNotifications.length > 0 && (
                  <div ref={notificationRef} className="absolute right-0 top-10 z-50 w-80 flex flex-col gap-2">
                    {displayedNotifications.map((notif) => {
                      const colors = getActionColorClasses(notif.action);
                      return (
                        <div
                          key={notif.displayId}
                          className={cn("flex flex-col rounded-lg border shadow-xl animate-in slide-in-from-top-2 duration-300", colors.bg, colors.border, "bg-[var(--color-surface)] px-3 py-2 text-xs")}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-[var(--color-text-primary)] truncate">{notif.user_email}</span>
                            <span className={cn("text-[10px] font-semibold shrink-0 ml-2", colors.text, "uppercase tracking-wider")}>{notif.action}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full shrink-0", colors.dot)} />
                            <span className="text-[var(--color-text-secondary)]">
                              <span className="capitalize">{notif.record_type}</span>
                              {notif.amount != null && ` · $${notif.amount}`}
                            </span>
                          </div>
                          <div className="text-[10px] text-[var(--color-text-secondary)] mt-1">
                            {new Date(notif.created_at).toLocaleDateString()} · {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {showActivityPanel && (
                <div ref={activityPanelRef} className="absolute right-0 top-10 w-80 max-h-96 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl z-40">
                  <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">Activity Timeline</span>
                    <span className="text-xs text-[var(--color-text-secondary)]">{isLoading ? 'Loading…' : `${logs.length} recent`}</span>
                  </div>
                  <div className="p-3 space-y-2">
                    {logs.length === 0 && !isLoading && (
                      <p className="text-xs text-[var(--color-text-secondary)] text-center py-4">No activity yet.</p>
                    )}
                    {logs.map((log) => {
                      const colors = getActionColorClasses(log.action);
                      return (
                        <div key={log.id} className={cn("flex flex-col rounded-lg border", colors.bg, colors.border, "bg-[var(--color-background)] px-3 py-2 text-xs")}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-[var(--color-text-primary)] truncate">{log.user_email}</span>
                            <span className={cn("text-[10px] font-semibold", colors.text, "uppercase tracking-wider")}>{log.action}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full", colors.dot)} />
                            <span className="text-[var(--color-text-secondary)]">
                              <span className="capitalize">{log.record_type}</span>
                              {log.amount != null && ` · $${log.amount}`}
                            </span>
                          </div>
                          <div className="text-[10px] text-[var(--color-text-secondary)] mt-1">
                            {new Date(log.created_at).toLocaleDateString()} · {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 pl-4 border-l border-[var(--color-border)] relative">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{user?.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Admin</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-[var(--color-surface-highlight)] flex items-center justify-center border border-[var(--color-border)] cursor-default transition-colors">
                  <User size={16} className="text-[var(--color-primary)]" />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>

      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
}