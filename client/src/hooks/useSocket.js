import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function useSocket() {
  const socketRef = useRef(null);
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', user.id);
    });

    // Listen for all notification types
    socket.on('notification', (data) => {
      addNotification(data);
      toast(data.title || 'New notification', { icon: '🔔', duration: 4000 });
    });

    socket.on('task_updated', (data) => {
      addNotification({
        title: `Task ${data.action}`,
        message: data.task?.title || 'Task updated',
        type: 'task_update',
        createdAt: new Date().toISOString(),
      });
    });

    socket.on('call_status', (data) => {
      addNotification({
        title: 'Call Status Update',
        message: `Call ${data.status}`,
        type: 'call_status',
        createdAt: new Date().toISOString(),
      });
    });

    socket.on('message_delivered', (data) => {
      addNotification({
        title: 'Message Delivered',
        message: `Message ${data.status} via ${data.channel}`,
        type: 'message',
        createdAt: new Date().toISOString(),
      });
    });

    socket.on('alert_fired', (data) => {
      addNotification({
        title: `Alert Level ${data.level}`,
        message: data.message,
        type: 'alert',
        createdAt: new Date().toISOString(),
      });
      toast.error(data.message, { duration: 6000 });
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  return socketRef.current;
}
