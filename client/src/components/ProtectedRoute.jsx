import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NexusLoader from './NexusLoader';
import './NexusLoader.css';

// Keep the loader on screen for at least this long,
// so the snake animation always has time to finish.
const MIN_LOADER_MS = 1400;

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), MIN_LOADER_MS);
    return () => clearTimeout(t);
  }, []);

  // Show the loader until BOTH:
  //   1. auth has resolved, AND
  //   2. the minimum display time has passed
  if (loading || !minTimePassed) {
    return <NexusLoader isVisible={true} duration={MIN_LOADER_MS} fullscreen={false} />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}