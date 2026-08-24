import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { PlacementDrives } from './pages/PlacementDrives';
import { AcceptInvite } from './pages/AcceptInvite';
import './styles/student.css';

function MainApp() {
  const { isAuthenticated, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check if opening with an invite token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('token') || window.location.pathname.includes('/accept-invite')) {
      setActiveView('accept-invite');
    }
  }, []);

  if (loading) {
    return (
      <div className="loading-state">
        Authenticating YuktiSetu Student Session...
      </div>
    );
  }

  // Unauthenticated routing
  if (!isAuthenticated) {
    if (activeView === 'accept-invite') {
      return <AcceptInvite setActiveView={setActiveView} />;
    }
    return <Login setActiveView={setActiveView} />;
  }

  // Authenticated Student Shell
  return (
    <div className="app-shell">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        collapsed={sidebarCollapsed}
        toggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="main-viewport">
        <Header />

        <main>
          {activeView === 'dashboard' && <Dashboard setActiveView={setActiveView} />}
          {activeView === 'profile' && <Profile />}
          {activeView === 'drives' && <PlacementDrives />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}