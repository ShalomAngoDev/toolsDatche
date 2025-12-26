import { useOnlineStatus } from '../utils/offline';
import './OfflineIndicator.css';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <div className={`offline-indicator ${isOnline ? 'online' : 'offline'}`}>
      {isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}
    </div>
  );
}

