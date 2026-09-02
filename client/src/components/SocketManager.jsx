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

      socket.on('notification', (data) => {
        toast.success(data.title, {
          duration: 5000,
          position: 'top-right',
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #334155'
          }
        });
        dispatch(addNotificationToState(data));
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
        toast(data.message, { icon: '📝' });
      });

      socket.on('attendance:update', (data) => {
        dispatch(updateAttendanceInState(data));
      });

      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('notification');
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
