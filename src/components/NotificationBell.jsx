import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';
import { notificationsApi } from '../api/notifications';
import { formatDate } from '../utils/time';

/**
 * The in-app bell.
 *
 * Polls only the unread COUNT on an interval; the list itself is fetched when
 * the panel is opened. A bell that polled the full list every minute would pull
 * a page of notification bodies down on every tick for a badge that is one
 * integer -- and on a drive-blast afternoon that is every student in the college
 * doing it at once.
 *
 * Polling rather than a socket is the right size for this system: the ceiling is
 * a few thousand daily users, and a minute of staleness on a badge costs nothing
 * that a WebSocket fleet would be worth.
 */

const POLL_MS = 60000;

const SEVERITY_ICON = {
  CRITICAL: XCircle,
  WARNING: AlertTriangle,
  SUCCESS: CheckCircle2,
  INFO: Info,
};

const SEVERITY_COLOR = {
  CRITICAL: '#ef4444',
  WARNING: '#f59e0b',
  SUCCESS: '#10b981',
  INFO: 'var(--text-secondary, #6b7280)',
};

function relativeTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  const refreshCount = useCallback(async () => {
    try {
      const count = await notificationsApi.unreadCount();
      setUnread(typeof count === 'number' ? count : 0);
    } catch {
      // notification-service being down must not break the page it sits on.
      // The badge simply stops updating.
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const page = await notificationsApi.list({ size: 15 });
      setItems(page?.content ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCount();
    const timer = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshCount]);

  // Close on an outside click or Escape. Without this the panel stays open
  // behind whatever the user clicked next.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  };

  const openItem = async (item) => {
    if (!item.read) {
      // Optimistic: the row greys out immediately and the badge drops, because
      // waiting on a round trip to acknowledge a click the user already made
      // reads as a broken button.
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
      setUnread((c) => Math.max(0, c - 1));
      try {
        await notificationsApi.markRead(item.id);
      } catch {
        refreshCount();
      }
    }
    if (item.actionUrl) {
      window.location.href = item.actionUrl;
    }
  };

  const markAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try {
      await notificationsApi.markAllRead();
    } catch {
      refreshCount();
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        className="btn btn-ghost btn-sm"
        onClick={toggle}
        title="Notifications"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        style={{ position: 'relative' }}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 8,
              background: '#ef4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              lineHeight: '16px',
              textAlign: 'center',
            }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: 360,
            maxHeight: 460,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-elevated, #ffffff)',
            border: '1px solid var(--border-color, #e5e7eb)',
            borderRadius: 12,
            boxShadow: '0 12px 32px rgba(0,0,0,0.16)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderBottom: '1px solid var(--border-color, #e5e7eb)',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary, #111827)' }}>
              Notifications
            </span>
            {unread > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={markAll}
                title="Mark all as read"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div style={{ overflowY: 'auto' }}>
            {loading && (
              <p style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary, #6b7280)' }}>
                Loading…
              </p>
            )}

            {!loading && items.length === 0 && (
              <p style={{ padding: 28, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary, #6b7280)' }}>
                Nothing yet. Drive updates will appear here.
              </p>
            )}

            {!loading &&
              items.map((item) => {
                const Icon = SEVERITY_ICON[item.severity] || Info;
                const colour = SEVERITY_COLOR[item.severity] || SEVERITY_COLOR.INFO;
                return (
                  <button
                    key={item.id}
                    onClick={() => openItem(item)}
                    style={{
                      display: 'flex',
                      gap: 10,
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 14px',
                      border: 'none',
                      borderBottom: '1px solid var(--border-color, #f3f4f6)',
                      background: item.read ? 'transparent' : 'var(--bg-subtle, #f8fafc)',
                      cursor: item.actionUrl ? 'pointer' : 'default',
                    }}
                  >
                    <Icon size={16} style={{ color: colour, flexShrink: 0, marginTop: 2 }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 13,
                          fontWeight: item.read ? 500 : 700,
                          color: 'var(--text-primary, #111827)',
                          marginBottom: 2,
                        }}
                      >
                        {item.title}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 12,
                          lineHeight: 1.45,
                          color: 'var(--text-secondary, #6b7280)',
                        }}
                      >
                        {item.body}
                      </span>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-tertiary, #9ca3af)', marginTop: 4 }}>
                        {relativeTime(item.createdAt)}
                      </span>
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
