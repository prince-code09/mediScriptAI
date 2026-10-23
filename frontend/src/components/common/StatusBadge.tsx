import React from 'react';
import { SyncStatus } from '../../types';
import { CheckCircle2, Clock, HardDrive, AlertCircle } from 'lucide-react';

interface Props {
  status: SyncStatus;
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<Props> = ({ status, showIcon = true, className = '' }) => {
  switch (status) {
    case 'saved_on_device':
      return (
        <span className={`badge badge-saved ${className}`} title="Saved locally on device (offline ready)">
          {showIcon && <HardDrive size={12} />}
          Saved on device
        </span>
      );
    case 'sync_pending':
      return (
        <span className={`badge badge-pending ${className}`} title="Queued for cloud synchronization">
          {showIcon && <Clock size={12} />}
          Sync pending
        </span>
      );
    case 'synced':
      return (
        <span className={`badge badge-synced ${className}`} title="Successfully synced to cloud database">
          {showIcon && <CheckCircle2 size={12} />}
          Synced
        </span>
      );
    case 'sync_failed':
      return (
        <span className={`badge badge-failed ${className}`} title="Cloud sync failed; retry available">
          {showIcon && <AlertCircle size={12} />}
          Sync failed — retry
        </span>
      );
    default:
      return null;
  }
};
