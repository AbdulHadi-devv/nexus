import NexusLoader from './NexusLoader';
import '../components/NexusLoader.css';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <NexusLoader isVisible={true} duration={1000} fullscreen={false} />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}