import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { TransactionProvider } from '@/context/TransactionContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ActivityProvider } from '@/context/ActivityContext';
import LoginPage from '@/pages/LoginPage';
import SignUpPage from '@/pages/SignUpPage';
import DashboardPage from '@/pages/DashboardPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function App() {
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

                {/* ✅ Unified transactions page — replaces /income and /expenses */}
                <Route path="/dashboard/transactions" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

                {/* ✅ Old routes redirect to /transactions so existing links don't break */}
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