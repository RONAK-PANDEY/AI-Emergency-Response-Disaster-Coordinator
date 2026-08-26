import React, { useState } from 'react';
import ReporterLayout from './components/ReporterLayout';
import ReportPage from './pages/ReportPage';
import GuidelinesPage from './pages/GuidelinesPage';
import TrackReportsPage from './pages/TrackReportsPage';

export default function App() {
  const [activePage, setActivePage] = useState('report');

  const renderPage = () => {
    switch (activePage) {
      case 'report': return <ReportPage />;
      case 'status': return <TrackReportsPage />;
      case 'guidelines': return <GuidelinesPage />;
      default: return <ReportPage />;
    }
  };

  return (
    <ReporterLayout
      activePage={activePage}
      onPageChange={setActivePage}
    >
      {renderPage()}
    </ReporterLayout>
  );
}
