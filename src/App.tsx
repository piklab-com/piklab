import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout/Layout';

// Pages
import Home from './pages/Home';
import Services from './pages/Services';
import Portfolio from './pages/Portfolio';
import Contact from './pages/Contact';

// Dashboards
import CustomerDashboard from './components/Dashboard/CustomerDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import DesignerDashboard from './components/Dashboard/DesignerDashboard';
import AdminPanel from './AdminPanel';

// Loading Component
import { motion } from 'motion/react';

const DashboardRouter = () => {
  const { user, isAdmin, isDesigner, loading } = useAuth();
  
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
  
  if (isAdmin) return <AdminDashboard />;
  if (isDesigner) return <DesignerDashboard />;
  return <CustomerDashboard />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/hizmetler" element={<Services />} />
            <Route path="/portfolyo" element={<Portfolio />} />
            <Route path="/iletisim" element={<Contact />} />
          </Route>
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
