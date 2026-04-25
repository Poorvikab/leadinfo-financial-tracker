import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { TransactionProvider } from '@/context/TransactionContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ActivityProvider } from '@/context/ActivityContext';
import LoginPage from '@/pages/LoginPage';
import SignUpPage from '@/pages/SignUpPage';
import DashboardPage from '@/pages/DashboardPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { validateSessionOnLoad, startSessionWatchdog } from '@/lib/supabaseClient'; // 👈 update this path to wherever your supabaseClient.ts lives

function App() {
  useEffect(() => {
    // 1. Validate on first load — kicks out deleted/revoked users immediately
    validateSessionOnLoad();

    // 2. Keep checking every 3 minutes while the tab is open
    const stopWatchdog = startSessionWatchdog();

    // 3. Clean up the interval when the component unmounts
    return () => stopWatchdog();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <ActivityProvider>
            <TransactionProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />

                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

                <Route path="/dashboard/transactions" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

                <Route path="/dashboard/income" element={<Navigate to="/dashboard/transactions" replace />} />
                <Route path="/dashboard/expenses" element={<Navigate to="/dashboard/transactions" replace />} />

                <Route path="/dashboard/401k" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/dashboard/reports" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </TransactionProvider>
          </ActivityProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;