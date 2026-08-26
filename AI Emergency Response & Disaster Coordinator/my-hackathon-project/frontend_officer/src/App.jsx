import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import IncidentLedgerPage from './pages/IncidentLedgerPage';
import MapViewPage from './pages/MapViewPage';
import DispatchPage from './pages/DispatchPage';
import SystemHealthPage from './pages/SystemHealthPage';

export default function App() {
  const [officerInfo, setOfficerInfo] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');

  function handleLoginSuccess(data) {
    setOfficerInfo(data);
    setActivePage('dashboard');
  }

  function handleLogout() {
    setOfficerInfo(null);
    setActivePage('dashboard');
  }

  if (!officerInfo) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  function renderPage() {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'incidents':
        return <IncidentLedgerPage />;
      case 'map':
        return <MapViewPage />;
      case 'dispatch':
        return <DispatchPage />;
      case 'health':
        return <SystemHealthPage officerInfo={officerInfo} />;
      default:
        return <DashboardPage />;
    }
  }

  return (
    <Layout
      activePage={activePage}
      onNavigate={setActivePage}
      officerInfo={officerInfo}
      onLogout={handleLogout}
    >
      {renderPage()}
    </Layout>
  );
}
