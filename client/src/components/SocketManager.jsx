import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { socket } from '../services/socket';
import { setConnected } from '../redux/slices/socketSlice';
import {
  updateProjectInState,
  removeProjectFromState,
  addNotificationToState,
  addWorkUpdateToState,
  updateAttendanceInState,
  addRequestToState,
  updateRequestStatusInState
} from '../redux/slices/dataSlice';
import { toast } from 'react-hot-toast';

const SocketManager = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit('join', { userId: user._id, role: user.role });

      socket.on('connect', () => {
        dispatch(setConnected(true));
      });

      socket.on('disconnect', () => {
        dispatch(setConnected(false));
      });

      // Handle both standard notification and push notification events
      const handleNotification = (data) => {
        toast.success(data.title || 'New Announcement', {
          duration: 5000,
          position: 'top-right',
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #334155',
          },
        });
        dispatch(addNotificationToState(data));
      };

      socket.on('notification', handleNotification);
      socket.on('notification_event', handleNotification);

      socket.on('task:new', (task) => {
        toast(`🎯 New Task Assigned: ${task.title}`, {
          duration: 5000,
          icon: '📋',
        });
      });

      socket.on('task:update', (task) => {
        toast(`Task updated: ${task.title} (${task.status})`, {
          icon: '🔄',
        });
      });

      socket.on('new_message', (msg) => {
        const senderName = msg.senderId?.name || 'Team Member';
        // Only toast if message isn't sent by current user
        const senderId = typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId;
        if (senderId !== user._id) {
          toast(`💬 Message from ${senderName}: ${msg.content?.slice(0, 30)}...`, {
            icon: '💬',
            duration: 4000,
          });
        }
      });

      socket.on('project:update', (project) => {
        dispatch(updateProjectInState(project));
      });

      socket.on('project:delete', (projectId) => {
        dispatch(removeProjectFromState(projectId));
      });

      socket.on('work:new', (work) => {
        dispatch(addWorkUpdateToState(work));
        if (user.role === 'admin') {
          toast.success(`New work update from ${work.userId?.name || 'User'}`);
        }
      });

      socket.on('request:new', (data) => {
        dispatch(addRequestToState(data));
        toast.success(`New ${data.type} received: ${data.subject}`);
      });

      socket.on('request:status', (data) => {
        dispatch(updateRequestStatusInState(data));
        toast(data.message || 'Request status updated', { icon: '📝' });
      });

      socket.on('attendance:update', (data) => {
        dispatch(updateAttendanceInState(data));
      });

      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('notification');
        socket.off('notification_event');
        socket.off('task:new');
        socket.off('task:update');
        socket.off('new_message');
        socket.off('project:update');
        socket.off('project:delete');
        socket.off('work:new');
        socket.off('request:new');
        socket.off('request:status');
        socket.off('attendance:update');
        socket.disconnect();
      };
    }
  }, [user, dispatch]);

  return null;
};

export default SocketManager;
