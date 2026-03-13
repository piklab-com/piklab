import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { Layout } from './components/Layout/Layout';
import { motion } from 'motion/react';

// Pages
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Portfolio from './pages/Portfolio';
import Contact from './pages/Contact';
import About from './pages/About';
import LoginPage from './pages/Login';

// Dashboards
import CustomerDashboard from './components/Dashboard/CustomerDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import DesignerDashboard from './components/Dashboard/DesignerDashboard';
import AdminPanel from './AdminPanel';

// Onboarding
import { OnboardingModal } from './components/OnboardingModal';

// ─── Loading Spinner ──────────────────────────────────────────────────
const Spinner = () => (
  <div className="h-screen w-full flex items-center justify-center bg-white">
    <motion.div
      animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="w-12 h-12 bg-primary rounded-xl"
    />
  </div>
);

// ─── Dashboard Router (Protected) ────────────────────────────────────
const DashboardRouter = () => {
  const { user, isAdmin, isDesigner, loading, profile } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && profile?.role === 'client') {
      const alreadyOnboarded = localStorage.getItem('teras_onboarded') || profile?.onboarded;
      if (!alreadyOnboarded) {
        setShowOnboarding(true);
      }
    }
  }, [user, profile]);

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/giris" replace />;

  return (
    <>
      {showOnboarding && (
        <OnboardingModal onClose={() => {
          localStorage.setItem('teras_onboarded', 'true');
          setShowOnboarding(false);
        }} />
      )}
      {isAdmin ? <AdminDashboard /> : isDesigner ? <DesignerDashboard /> : <CustomerDashboard />}
    </>
  );
};

// ─── App ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <SiteSettingsProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Site */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/hizmetler" element={<Services />} />
              <Route path="/hizmetler/:slug" element={<ServiceDetail />} />
              <Route path="/portfolyo" element={<Portfolio />} />
              <Route path="/hakkimizda" element={<About />} />
              <Route path="/iletisim" element={<Contact />} />
            </Route>

            {/* Auth */}
            <Route path="/giris" element={<LoginPage />} />

            {/* Dashboard (Protected) */}
            <Route path="/dashboard" element={<DashboardRouter />} />

            {/* CMS Admin Panel */}
            <Route path="/admin" element={<AdminPanel />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SiteSettingsProvider>
    </AuthProvider>
  );
}
