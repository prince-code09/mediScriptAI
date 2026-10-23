import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { Toast } from './components/common/Toast';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { PrescriptionsPage } from './pages/PrescriptionsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';

const MainAppContent: React.FC = () => {
  const { currentPage, user } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Unauthenticated / Landing & Auth Views
  if (!user.isLoggedIn) {
    if (currentPage === 'landing') {
      return (
        <>
          <LandingPage />
          <Toast />
        </>
      );
    }

    return (
      <>
        <AuthPage />
        <Toast />
      </>
    );
  }

  // Authenticated App Shell
  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <Sidebar 
        mobileOpen={mobileMenuOpen} 
        onCloseMobile={() => setMobileMenuOpen(false)} 
      />

      {/* Main Content Viewport */}
      <div className="main-content-area">
        <Header onToggleMobileMenu={() => setMobileMenuOpen(true)} />

        <main style={{ flex: 1 }}>
          {(currentPage === 'home' || currentPage === 'landing' || currentPage === 'auth') && <HomePage />}
          {currentPage === 'dashboard' && <DashboardPage />}
          {currentPage === 'patients' && <PatientsPage />}
          {currentPage === 'prescriptions' && <PrescriptionsPage />}
          {currentPage === 'history' && <HistoryPage />}
          {currentPage === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Floating System Notifications */}
      <Toast />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

export default App;
