import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '@/services/api';
import { useDispatch } from 'react-redux';
import { setCredentials, logout as logoutAction } from '../redux/slices/authSlice';
import { resetData } from '../redux/slices/dataSlice';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const res = await getMe();
      const userData = res.data.user;
      const token = localStorage.getItem('token');
      setUser(userData);
      dispatch(setCredentials({ user: userData, token }));
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch(logoutAction());
      dispatch(resetData());
    } finally {
      setLoading(false);
    }
  };

  const loginUser = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    dispatch(setCredentials({ user: userData, token }));
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    dispatch(logoutAction());
    dispatch(resetData());
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};
