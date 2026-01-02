import React, { useState, useEffect } from 'react';
import { notificationApi } from '../../services/notification.api';
import { Bell, X, AlertTriangle, BookOpen, UserX, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'attendance_alert' | 'homework_assigned' | 'grade_published' | 'announcement' | 'warning';
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  timeAgo: string;
  createdAt: string;
  sender?: {
    name: string;
    role: string;
  };
}

interface NotificationAlertProps {
  className?: string;
  maxVisible?: number;
}

const NotificationAlert: React.FC<NotificationAlertProps> = ({ 
  className = '', 
  maxVisible = 5 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotifications = React.useCallback(async () => {
    try {
      const response = await notificationApi.getMyNotifications({
        isRead: false,
        limit: maxVisible,
      });
      
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [maxVisible]);

  const loadUnreadCount = React.useCallback(async () => {
    try {
      const response = await notificationApi.getUnreadCount();
      if (response.data.success) {
        setUnreadCount(response.data.data?.count || 0);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
      loadUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadNotifications, loadUnreadCount]);

  const markAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications marked as read');
      
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'attendance_alert':
        return <UserX className="h-5 w-5 text-red-500" />;
      case 'homework_assigned':
        return <BookOpen className="h-5 w-5 text-blue-500" />;
      case 'grade_published':
        return <Calendar className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 rounded mb-2"></div>
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (notifications.length === 0 && unreadCount === 0) {
    return null; // Don't show anything if no notifications
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Notification Header */}
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Bell className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-gray-900">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={markAllAsRead}
            className="text-xs"
          >
            Mark All Read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {(isExpanded || unreadCount > 0) && notifications.length > 0 && (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`p-3 border-l-4 ${getPriorityColor(notification.priority)} relative`}
            >
              <button
                onClick={() => markAsRead(notification.id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="flex items-start gap-3 pr-6">
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {notification.timeAgo}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {notification.message}
                  </p>
                  {notification.sender && (
                    <p className="text-xs text-gray-500 mt-1">
                      From: {notification.sender.name}
                    </p>
                  )}
                  
                  {/* Special handling for attendance alerts */}
                  {notification.type === 'attendance_alert' && notification.data && (
                    <div className="mt-2 text-xs text-gray-600 bg-gray-100 rounded p-2">
                      <p><strong>Subject:</strong> {notification.data.subjectName}</p>
                      <p><strong>Class:</strong> {notification.data.className}</p>
                      <p><strong>Date:</strong> {new Date(notification.data.date).toDateString()}</p>
                      <p><strong>Period:</strong> {notification.data.period}</p>
                    </div>
                  )}
                  
                  {/* Special handling for homework notifications */}
                  {notification.type === 'homework_assigned' && notification.data && (
                    <div className="mt-2 text-xs text-gray-600 bg-gray-100 rounded p-2">
                      <p><strong>Subject:</strong> {notification.data.subjectName}</p>
                      <p><strong>Due Date:</strong> {new Date(notification.data.dueDate).toDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {isExpanded && notifications.length === 0 && (
        <Card className="p-4 text-center">
          <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No unread notifications</p>
        </Card>
      )}
    </div>
  );
};

export default NotificationAlert;