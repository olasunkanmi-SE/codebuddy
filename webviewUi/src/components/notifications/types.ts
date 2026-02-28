export interface INotificationItem {
  id: number;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  source?: string;
}

export interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: INotificationItem[];
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onDelete: (id: number) => void;
}
