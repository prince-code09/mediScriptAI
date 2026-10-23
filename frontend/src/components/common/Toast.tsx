import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 size={18} className="toast-icon text-emerald-500" />,
    info: <Info size={18} className="toast-icon text-blue-500" />,
    warning: <AlertTriangle size={18} className="toast-icon text-amber-500" />,
    error: <AlertCircle size={18} className="toast-icon text-red-500" />
  };

  return (
    <aside 
      aria-label="Notifications"
      className="toast-container no-print" 
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        maxWidth: '420px',
        width: 'calc(100% - 48px)',
        pointerEvents: 'auto'
      }}
    >
      <div 
        role="alert"
        aria-live="polite"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-subtle)',
          borderLeft: `4px solid ${
            toast.type === 'success' ? '#10B981' :
            toast.type === 'error' ? '#EF4444' :
            toast.type === 'warning' ? '#F59E0B' : 'var(--ai-violet)'
          }`
        }}
      >
        <div style={{ flexShrink: 0 }}>
          {icons[toast.type]}
        </div>
        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 500, flex: 1, color: 'var(--text-primary)' }}>
          {toast.message}
        </p>
        <button 
          onClick={hideToast}
          aria-label="Dismiss notification"
          style={{
            color: 'var(--text-muted)',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex'
          }}
        >
          <X size={15} />
        </button>
      </div>
    </aside>
  );
};
