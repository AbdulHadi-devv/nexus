import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as api from '../services/api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await api.getItems();
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults(null);
      return;
    }

    try {
      const response = await api.search(searchQuery);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await api.deleteItem(id);
      setItems(items.filter(item => item.id !== id));
      if (searchResults) {
        setSearchResults({
          ...searchResults,
          items: searchResults.items.filter(item => item.id !== id)
        });
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getTypeIcon = (type) => {
    const icons = {
      NOTE: '📝',
      BOOKMARK: '🔗',
      CODE: '💻',
      IDEA: '💡',
      RESOURCE: '📚'
    };
    return icons[type] || '📄';
  };

  const getTypeLabel = (type) => {
    return type || 'NOTE';
  };

  const getDisplayItems = () => {
    if (searchResults) {
      return searchResults.items || [];
    }
    if (filterType !== 'all') {
      return items.filter(item => item.type === filterType);
    }
    return items;
  };

  const displayItems = getDisplayItems();

  // Calculate stats
  const totalItems = items.length;
  const totalConnections = items.reduce((acc, item) => {
    return acc + (item.connectionsFrom?.length || 0) + (item.connectionsTo?.length || 0);
  }, 0) / 2;
  const totalTags = new Set(items.flatMap(i => i.tags?.map(t => t.id) || [])).size;
  const notesCount = items.filter(i => i.type === 'NOTE').length;
  const bookmarksCount = items.filter(i => i.type === 'BOOKMARK').length;
  const codeCount = items.filter(i => i.type === 'CODE').length;

  return (
    <div className="knowledge-page page-transition">
      {/* Header */}
      <header className="knowledge-header">
        <div className="knowledge-header-content">
          <div className="knowledge-logo">NEXUS</div>
          <div className="knowledge-header-actions">
            <Link to="/ai-builder" className="nav-link">🤖 AI Builder</Link>
            <span className="nav-link active">📚 Dashboard</span>
            <Link to="/knowledge/graph" className="nav-link">🕸️ Graph</Link>
            <span className="user-name">👤 {user?.name}</span>
            <Link to="/knowledge/create" className="primary-button small">
              + New Item
            </Link>
            <button
              className="theme-toggle-small"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              title="Toggle theme"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={handleLogout} className="logout-button">
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Statistics */}
        <div className="knowledge-stats">
          <div className="stat-card">
            <span className="stat-icon">📚</span>
            <div className="stat-info">
              <span className="stat-number">{totalItems}</span>
              <span className="stat-label">Total Items</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🔗</span>
            <div className="stat-info">
              <span className="stat-number">{totalConnections}</span>
              <span className="stat-label">Connections</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🏷️</span>
            <div className="stat-info">
              <span className="stat-number">{totalTags}</span>
              <span className="stat-label">Tags</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📝</span>
            <div className="stat-info">
              <span className="stat-number">{notesCount}</span>
              <span className="stat-label">Notes</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🔗</span>
            <div className="stat-info">
              <span className="stat-number">{bookmarksCount}</span>
              <span className="stat-label">Bookmarks</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💻</span>
            <div className="stat-info">
              <span className="stat-number">{codeCount}</span>
              <span className="stat-label">Code Snippets</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search your knowledge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">🔍 Search</button>
            {searchResults && (
              <button 
                onClick={() => { setSearchResults(null); setSearchQuery(''); }}
                className="clear-search"
              >
                ✕ Clear
              </button>
            )}
          </form>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button 
            className={filterType === 'all' ? 'active' : ''}
            onClick={() => setFilterType('all')}
          >
            All ({items.length})
          </button>
          <button 
            className={filterType === 'NOTE' ? 'active' : ''}
            onClick={() => setFilterType('NOTE')}
          >
            📝 Notes ({items.filter(i => i.type === 'NOTE').length})
          </button>
          <button 
            className={filterType === 'BOOKMARK' ? 'active' : ''}
            onClick={() => setFilterType('BOOKMARK')}
          >
            🔗 Bookmarks ({items.filter(i => i.type === 'BOOKMARK').length})
          </button>
          <button 
            className={filterType === 'CODE' ? 'active' : ''}
            onClick={() => setFilterType('CODE')}
          >
            💻 Code ({items.filter(i => i.type === 'CODE').length})
          </button>
          <button 
            className={filterType === 'IDEA' ? 'active' : ''}
            onClick={() => setFilterType('IDEA')}
          >
            💡 Ideas ({items.filter(i => i.type === 'IDEA').length})
          </button>
          <button 
            className={filterType === 'RESOURCE' ? 'active' : ''}
            onClick={() => setFilterType('RESOURCE')}
          >
            📚 Resources ({items.filter(i => i.type === 'RESOURCE').length})
          </button>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="loading-state">Loading your knowledge...</div>
        ) : (
          <>
            {searchResults && (
              <div className="search-info">
                Found {searchResults.items?.length || 0} items
                {searchResults.tags?.length > 0 && `, ${searchResults.tags.length} tags`}
              </div>
            )}

            <div className="items-grid">
              {displayItems.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🧠</div>
                  <h3>Your knowledge is empty</h3>
                  <p>Start by adding your first knowledge item.</p>
                  <Link to="/knowledge/create" className="primary-button">
                    + Create Your First Item
                  </Link>
                </div>
              ) : (
                displayItems.map((item) => (
                  <div key={item.id} className="item-card">
                    <div className="item-card-header">
                      <span className="item-type">{getTypeIcon(item.type)} {getTypeLabel(item.type)}</span>
                      <div className="item-actions">
                        <Link to={`/knowledge/item/${item.id}`} className="item-action-link">📖</Link>
                        <button onClick={() => handleDelete(item.id)} className="item-action-delete">🗑️</button>
                      </div>
                    </div>
                    <Link to={`/knowledge/item/${item.id}`} className="item-card-link">
                      <h3>{item.title}</h3>
                      <p className="item-preview">
                        {item.content?.substring(0, 120)}
                        {item.content?.length > 120 && '...'}
                      </p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="item-tags">
                          {item.tags.map(tag => (
                            <span key={tag.id} className="tag" style={{ backgroundColor: tag.color || '#6366f1' }}>
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="item-meta">
                        <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
                        {item.url && <span className="item-url">🔗 {item.url}</span>}
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}