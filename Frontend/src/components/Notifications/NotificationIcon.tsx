import React from 'react';
import {
  ShoppingCart,
  ChefHat,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  PackageMinus,
  Box,
  FileText,
  CheckSquare,
  XCircle,
  ClipboardCheck,
  AlertCircle,
  Wallet,
  Unlock,
  Lock,
  Truck,
  Calendar,
  Clock,
  Bell,
  PlayCircle,
  ClipboardEdit,
  AlertOctagon,
  Info
} from 'lucide-react';
import { NOTIFICATION_TYPES, NotificationPriority } from '../../services/notifications';

interface NotificationIconProps {
  type?: string;
  priority?: NotificationPriority;
  size?: number;
  className?: string;
}

export function NotificationIcon({ type = 'notificacao', priority = 'normal', size = 18, className = '' }: NotificationIconProps) {
  const config = NOTIFICATION_TYPES[type];
  const iconName = config?.iconName;

  const renderIcon = () => {
    switch (iconName) {
      case 'ShoppingCart':
        return <ShoppingCart size={size} />;
      case 'ChefHat':
        return <ChefHat size={size} />;
      case 'RefreshCw':
        return <RefreshCw size={size} />;
      case 'CheckCircle2':
      case 'CheckCircle':
        return <CheckCircle2 size={size} />;
      case 'PackageMinus':
        return <PackageMinus size={size} />;
      case 'Box':
        return <Box size={size} />;
      case 'FileText':
        return <FileText size={size} />;
      case 'CheckSquare':
        return <CheckSquare size={size} />;
      case 'XCircle':
        return <XCircle size={size} />;
      case 'ClipboardCheck':
        return <ClipboardCheck size={size} />;
      case 'AlertCircle':
        return <AlertCircle size={size} />;
      case 'Wallet':
        return <Wallet size={size} />;
      case 'Unlock':
        return <Unlock size={size} />;
      case 'Lock':
        return <Lock size={size} />;
      case 'Truck':
        return <Truck size={size} />;
      case 'Calendar':
        return <Calendar size={size} />;
      case 'Clock':
        return <Clock size={size} />;
      case 'PlayCircle':
        return <PlayCircle size={size} />;
      case 'ClipboardEdit':
        return <ClipboardEdit size={size} />;
      case 'AlertOctagon':
        return <AlertOctagon size={size} />;
      case 'AlertTriangle':
        return <AlertTriangle size={size} />;
      default:
        if (priority === 'critical') return <AlertTriangle size={size} />;
        if (priority === 'high') return <AlertCircle size={size} />;
        return <Bell size={size} />;
    }
  };

  const getPriorityClasses = () => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60 border-red-200 dark:border-red-900/60';
      case 'high':
        return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60';
      case 'low':
        return 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
      case 'normal':
      default:
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/60';
    }
  };

  return (
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${getPriorityClasses()} ${className}`}
    >
      {renderIcon()}
    </div>
  );
}
