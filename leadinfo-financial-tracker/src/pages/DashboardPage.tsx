import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardHome from '@/components/views/DashboardHome';
import TransactionsView from '@/components/views/TransactionsView'; // ✅ unified
import FourOhOneKView from '@/components/views/FourOhOneKView';
import ReportsView from '@/components/views/ReportsView';
import SettingsView from '@/components/views/SettingsView';
import UserProfileView from '@/components/views/UserProfileView';

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState('dashboard');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = location.pathname || '/dashboard';
    const parts = path.split('/').filter(Boolean);
    const section = parts[1] || 'dashboard';

    // ✅ 'income' and 'expenses' both map to 'transactions'
    const viewMap: Record<string, string> = {
      income: 'transactions',
      expenses: 'transactions',
    };

    const allowedViews = ['dashboard', 'transactions', '401k', 'reports', 'settings', 'profile'];
    const mapped = viewMap[section] ?? section;
    const nextView = allowedViews.includes(mapped) ? mapped : 'dashboard';

    if (nextView !== currentView) {
      setCurrentView(nextView);
    }
  }, [location.pathname, currentView]);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    const targetPath = view === 'dashboard' ? '/dashboard' : `/dashboard/${view}`;
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':    return <DashboardHome onNavigate={handleNavigate} />;
      case 'transactions': return <TransactionsView />; // ✅ replaces income + expenses
      case '401k':         return <FourOhOneKView />;
      case 'reports':      return <ReportsView />;
      case 'settings':     return <SettingsView />;
      case 'profile':      return <UserProfileView />;
      default:             return <DashboardHome onNavigate={setCurrentView} />;
    }
  };

  return (
    <DashboardLayout currentView={currentView} onNavigate={handleNavigate}>
      {renderView()}
    </DashboardLayout>
  );
}