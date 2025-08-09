import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Gift } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'reward';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'reward':
        return <Gift className="w-5 h-5 text-purple-400" />;
      default:
        return null;
    }
  };
  
  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-900 border-emerald-700';
      case 'error':
        return 'bg-red-900 border-red-700';
      case 'warning':
        return 'bg-yellow-900 border-yellow-700';
      case 'reward':
        return 'bg-purple-900 border-purple-700';
      default:
        return 'bg-gray-900 border-gray-700';
    }
  };
  
  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${getBgColor()} shadow-lg animate-slide-in`}>
      <div className="flex items-center space-x-3">
        {getIcon()}
        <span className="text-white font-medium">{message}</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;