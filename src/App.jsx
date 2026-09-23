import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Documents } from './pages/Documents';
import { PlacementDrives } from './pages/PlacementDrives';
import { Settings } from './pages/Settings';
import { AcceptInvite } from './pages/AcceptInvite';
import './styles/student.css';

/**
 * Is this page load an invite activation?
 *
 * Read synchronously during the first render, not in an effect. An effect runs
 * after the first paint, so the visitor briefly saw the Login screen before the
 * invite form replaced it -- and anyone who typed into that flash got an
 * invalid-credentials error for an account that does not have a password yet.
 */
function isInviteLink() {
  const params = new URLSearchParams(window.location.search);
  return Boolean(params.get('token')) || window.location.pathname.includes('/accept-invite');
}

function MainApp() {
  const { isAuthenticated, loading } = useAuth();
  const [activeView, setActiveView] = useState(() => (isInviteLink() ? 'accept-invite' : 'dashboard'));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Activating an invite comes BEFORE the auth and loading gates -- see
  // isInviteLink above. The invited person is not whoever happens to be signed
  // in on this browser.
  if (activeView === 'accept-invite') {
    return <AcceptInvite setActiveView={setActiveView} />;
  }

  if (loading) {
    return (
      <div className="loading-state">
        Authenticating YuktiSetu Student Session...
      </div>
    );
  }

  // Unauthenticated routing
  if (!isAuthenticated) {
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
          {activeView === 'documents' && <Documents />}
          {activeView === 'drives' && <PlacementDrives />}
          {activeView === 'settings' && <Settings />}
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