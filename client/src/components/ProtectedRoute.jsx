import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 * --------------
 * Only guards access — does NOT show a loader.
 * Page components (Dashboard, Graph, etc.) handle their own loading state
 * and render the NexusLoader themselves. This prevents the loader from
 * being mounted twice (once here, once inside the page) and restarting.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    // Render a neutral background — no loader.
    // Pages will render their own loader the moment they mount.
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary, #0b0b14)',
        }}
      />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}