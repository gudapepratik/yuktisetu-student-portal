import React from 'react';
import { LayoutDashboard, User, FileText, Briefcase, Trophy, Code, LogOut, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'resume', label: 'Resume Builder', icon: FileText },
  { id: 'drives', label: 'Placement Drives', icon: Briefcase },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
  { id: 'coding', label: 'Coding Profiles', icon: Code },
];

export function Sidebar({ activeView, setActiveView, collapsed, toggleCollapse }) {
  const { user } = useAuth();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} style={{ width: collapsed ? '72px' : '250px', transition: 'width 0.2s ease' }}>
      <div className="sidebar-brand" style={{ padding: collapsed ? '20px 12px' : '20px 18px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div className="brand-icon">YS</div>
        {!collapsed && (
          <div className="brand-info">
            <div className="brand-title">YuktiSetu</div>
            <div className="brand-sub">Student Portal</div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {!collapsed && <div className="nav-section-label">Navigation</div>}
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '9px' : '9px 12px' }}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={18} />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer" style={{ justifyContent: collapsed ? 'center' : 'space-between', padding: '12px' }}>
        {!collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-mono)' }}>
              Student
            </div>
          </div>
        )}
        <button
          className="btn btn-ghost btn-sm"
          onClick={toggleCollapse}
          style={{ padding: '6px', minWidth: '32px' }}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
        </button>
      </div>
    </aside>
  );
}