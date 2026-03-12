import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout/Layout';
import { motion } from 'motion/react';

// Pages
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Portfolio from './pages/Portfolio';
import Contact from './pages/Contact';
import About from './pages/About';

// Dashboards
import CustomerDashboard from './components/Dashboard/CustomerDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import DesignerDashboard from './components/Dashboard/DesignerDashboard';
import AdminPanel from './AdminPanel';

// Onboarding
import { OnboardingModal } from './components/OnboardingModal';

const DashboardRouter = () => {
  const { user, isAdmin, isDesigner, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user) {
      const alreadyOnboarded = localStorage.getItem('piklab_onboarded');
      if (!alreadyOnboarded) {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-white">
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-12 h-12 bg-primary rounded-xl"
      />
    </div>
  );

  if (!user) {
    window.location.href = '/';
    return null;
  }

  return (
    <>
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
      {isAdmin ? <AdminDashboard /> : isDesigner ? <DesignerDashboard /> : <CustomerDashboard />}
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/hizmetler" element={<Services />} />
            <Route path="/hizmetler/:slug" element={<ServiceDetail />} />
            <Route path="/portfolyo" element={<Portfolio />} />
            <Route path="/hakkimizda" element={<About />} />
            <Route path="/iletisim" element={<Contact />} />
          </Route>
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
