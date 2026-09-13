import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SavedProvider } from './context/SavedContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { Navbar } from './components/Navbar.jsx';
import { LoginPage } from './pages/LoginPage.jsx';

import { ListingsPage } from './pages/ListingsPage.jsx';
import { ListingDetailPage } from './pages/ListingDetailPage.jsx';
import { SavedPage } from './pages/SavedPage.jsx';
import { RentalsPage } from './pages/RentalsPage.jsx';
import { ProjectsPage } from './pages/ProjectsPage.jsx';
import { InsightsPage } from './pages/InsightsPage.jsx';

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}

function WelcomePlaceholder({ title = "Feature Coming Soon" }) {
  const { user } = useAuth();
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-xl mx-auto mt-12 shadow-sm">
      <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
        ✓
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
      <p className="text-sm text-slate-600 mb-4">
        Logged in as <span className="font-semibold text-slate-800">{user?.email}</span>.
      </p>
      <p className="text-xs text-slate-500">
        This section will be mounted in upcoming Phase 4 milestones.
      </p>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <SavedProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Application Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/listings" replace />} />
              <Route path="/listings" element={<ListingsPage />} />
              <Route path="/listings/:id" element={<ListingDetailPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/rentals" element={<RentalsPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/insights" element={<InsightsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SavedProvider>
    </AuthProvider>
  );
}

export default App;
