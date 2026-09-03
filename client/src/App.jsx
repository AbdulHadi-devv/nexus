import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// AI Builder Pages
import AIBuilder from './pages/AIBuilder';

// Knowledge Management Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateItem from './pages/CreateItem';
import ItemDetail from './pages/ItemDetail';
import KnowledgeGraph from './pages/KnowledgeGraph';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Root redirects to AI Builder */}
          <Route path="/" element={<Navigate to="/ai-builder" replace />} />
          
          {/* AI Builder Route (Public - No login required) */}
          <Route path="/ai-builder" element={<AIBuilder />} />
          
          {/* Knowledge Management Routes (Require Login) */}
          <Route
            path="/knowledge"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge/create"
            element={
              <ProtectedRoute>
                <CreateItem />
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge/item/:id"
            element={
              <ProtectedRoute>
                <ItemDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge/graph"
            element={
              <ProtectedRoute>
                <KnowledgeGraph />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;