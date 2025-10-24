import React from 'react';
import { ConnectionStatus } from '@/types/trading';

interface ConnectionStatusProps {
  status: ConnectionStatus;
  onReconnect: () => void;
}

export const ConnectionStatusComponent: React.FC<ConnectionStatusProps> = ({
  status,
  onReconnect,
}) => {
  const getStatusColor = () => {
    if (status.isConnected) return 'text-green-400';
    if (status.isReconnecting) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusText = () => {
    if (status.isConnected) return 'Connected';
    if (status.isReconnecting) return 'Reconnecting...';
    return 'Disconnected';
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${getStatusColor().replace('text-', 'bg-')}`} />
      <span className={getStatusColor()}>{getStatusText()}</span>
      {status.latency > 0 && (
        <span className="text-neutral-400">
          {status.latency}ms
        </span>
      )}
      {!status.isConnected && !status.isReconnecting && (
        <button
          onClick={onReconnect}
          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Reconnect
        </button>
      )}
    </div>
  );
};
