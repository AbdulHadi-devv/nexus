import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useMinimumLoader from '../hooks/useMinimumLoader';
import NexusLoader from './NexusLoader';
import './NexusLoader.css';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const showLoader = useMinimumLoader(loading);

  if (showLoader) {
    return <NexusLoader isVisible={true} duration={1400} fullscreen={false} />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}