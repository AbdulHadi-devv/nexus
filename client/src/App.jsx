import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

import AIBuilder from './pages/AIBuilder';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateItem from './pages/CreateItem';
import ItemDetail from './pages/ItemDetail';
import KnowledgeGraph from './pages/KnowledgeGraph';
import StatsDashboard from './pages/StatsDashboard';
import TagManager from './pages/TagManager';
import NotFound from './pages/NotFound';

import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Root */}
            <Route path="/" element={<Navigate to="/ai-builder" replace />} />

            {/* AI Builder */}
            <Route path="/ai-builder" element={<AIBuilder />} />

            {/* Knowledge Management */}
            <Route path="/knowledge" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/knowledge/create" element={
              <ProtectedRoute><CreateItem /></ProtectedRoute>
            } />
            <Route path="/knowledge/item/:id" element={
              <ProtectedRoute><ItemDetail /></ProtectedRoute>
            } />
            <Route path="/knowledge/graph" element={
              <ProtectedRoute><KnowledgeGraph /></ProtectedRoute>
            } />
            <Route path="/knowledge/stats" element={
              <ProtectedRoute><StatsDashboard /></ProtectedRoute>
            } />
            <Route path="/knowledge/tags" element={
              <ProtectedRoute><TagManager /></ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;