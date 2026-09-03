import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as api from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [connections, setConnections] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [showConnect, setShowConnect] = useState(false);
  const [selectedConnectItem, setSelectedConnectItem] = useState('');
  const [connectType, setConnectType] = useState('RELATED');

  useEffect(() => {
    fetchItem();
    fetchConnections();
    fetchAllItems();
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await api.getItem(id);
      setItem(response.data);
    } catch (error) {
      setError('Failed to load item');
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await api.getConnectionsByItem(id);
      setConnections(response.data);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    }
  };

  const fetchAllItems = async () => {
    try {
      const response = await api.getItems();
      setAllItems(response.data.filter(i => i.id !== id));
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.updateItem(id, item);
      setIsEditing(false);
      fetchItem();
    } catch (error) {
      setError('Failed to update item');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.deleteItem(id);
      navigate('/knowledge');
    } catch (error) {
      setError('Failed to delete item');
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!selectedConnectItem) return;

    try {
      await api.createConnection({
        fromItemId: id,
        toItemId: selectedConnectItem,
        type: connectType,
      });
      setShowConnect(false);
      fetchConnections();
      setSelectedConnectItem('');
    } catch (error) {
      setError('Failed to create connection');
    }
  };

  const handleDeleteConnection = async (connectionId) => {
    if (!window.confirm('Remove this connection?')) return;
    try {
      await api.deleteConnection(connectionId);
      fetchConnections();
    } catch (error) {
      setError('Failed to delete connection');
    }
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

  const getConnectedItem = (connection) => {
    return connection.fromItemId === id ? connection.toItem : connection.fromItem;
  };

  if (loading) return (
    <div className="knowledge-page">
      <div className="knowledge-header">
        <div className="knowledge-header-content">
          <div className="knowledge-logo">NEXUS</div>
          <div className="knowledge-header-actions">
            <Link to="/ai-builder" className="nav-link">🤖 AI Builder</Link>
            <Link to="/knowledge" className="nav-link">📚 Dashboard</Link>
            <Link to="/knowledge/graph" className="nav-link">🕸️ Graph</Link>
            <button
              className="theme-toggle-small"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              title="Toggle theme"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>
      <div className="loading-state" style={{ padding: '60px 20px', textAlign: 'center' }}>Loading...</div>
    </div>
  );

  if (error) return (
    <div className="knowledge-page">
      <div className="knowledge-header">
        <div className="knowledge-header-content">
          <div className="knowledge-logo">NEXUS</div>
          <div className="knowledge-header-actions">
            <Link to="/ai-builder" className="nav-link">🤖 AI Builder</Link>
            <Link to="/knowledge" className="nav-link">📚 Dashboard</Link>
            <Link to="/knowledge/graph" className="nav-link">🕸️ Graph</Link>
            <button
              className="theme-toggle-small"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              title="Toggle theme"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>
      <div className="error-message" style={{ margin: '20px' }}>{error}</div>
    </div>
  );

  if (!item) return (
    <div className="knowledge-page">
      <div className="knowledge-header">
        <div className="knowledge-header-content">
          <div className="knowledge-logo">NEXUS</div>
          <div className="knowledge-header-actions">
            <Link to="/ai-builder" className="nav-link">🤖 AI Builder</Link>
            <Link to="/knowledge" className="nav-link">📚 Dashboard</Link>
            <Link to="/knowledge/graph" className="nav-link">🕸️ Graph</Link>
            <button
              className="theme-toggle-small"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              title="Toggle theme"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>
      <div className="error-message" style={{ margin: '20px' }}>Item not found</div>
    </div>
  );

  return (
    <div className="knowledge-page page-transition">
      {/* Header */}
      <header className="knowledge-header">
        <div className="knowledge-header-content">
          <div className="knowledge-logo">NEXUS</div>
          <div className="knowledge-header-actions">
            <Link to="/ai-builder" className="nav-link">🤖 AI Builder</Link>
            <Link to="/knowledge" className="nav-link">📚 Dashboard</Link>
            <Link to="/knowledge/graph" className="nav-link">🕸️ Graph</Link>
            <button
              className="theme-toggle-small"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              title="Toggle theme"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="item-detail-page">
        <div className="page-header">
          <Link to="/knowledge" className="back-link">← Dashboard</Link>
          <h1>{isEditing ? 'Edit Item' : item.title}</h1>
          <div className="header-actions">
            {!isEditing && (
              <>
                <button onClick={() => setIsEditing(true)} className="edit-button">✏️ Edit</button>
                <button onClick={handleDelete} className="delete-button">🗑️ Delete</button>
                <button onClick={() => setShowConnect(true)} className="connect-button">🔗 Connect</button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="edit-form">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={item.title}
                onChange={(e) => setItem({...item, title: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select
                value={item.type}
                onChange={(e) => setItem({...item, type: e.target.value})}
              >
                <option value="NOTE">📝 Note</option>
                <option value="BOOKMARK">🔗 Bookmark</option>
                <option value="CODE">💻 Code Snippet</option>
                <option value="IDEA">💡 Idea</option>
                <option value="RESOURCE">📚 Resource</option>
              </select>
            </div>
            <div className="form-group">
              <label>Content</label>
              <textarea
                value={item.content}
                onChange={(e) => setItem({...item, content: e.target.value})}
                rows="10"
                required
              />
            </div>
            {item.type === 'BOOKMARK' && (
              <div className="form-group">
                <label>URL</label>
                <input
                  type="url"
                  value={item.url || ''}
                  onChange={(e) => setItem({...item, url: e.target.value})}
                />
              </div>
            )}
            {item.type === 'CODE' && (
              <div className="form-group">
                <label>Language</label>
                <input
                  type="text"
                  value={item.language || ''}
                  onChange={(e) => setItem({...item, language: e.target.value})}
                />
              </div>
            )}
            <div className="form-actions">
              <button type="button" onClick={() => setIsEditing(false)} className="cancel-button">Cancel</button>
              <button type="submit" className="primary-button">Save Changes</button>
            </div>
          </form>
        ) : (
          <>
            <div className="item-detail-content">
              <div className="item-meta-detail">
                <span className="item-type-badge">{getTypeIcon(item.type)} {item.type}</span>
                {item.tags && item.tags.length > 0 && (
                  <div className="item-tags-detail">
                    {item.tags.map(tag => (
                      <span key={tag.id} className="tag" style={{ backgroundColor: tag.color || '#6366f1' }}>
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="item-dates">
                  <span>Created: {new Date(item.createdAt).toLocaleString()}</span>
                  <span>Updated: {new Date(item.updatedAt).toLocaleString()}</span>
                </div>
                {item.url && (
                  <div className="item-url-detail">
                    🔗 <a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>
                  </div>
                )}
                {item.language && (
                  <div className="item-language">💻 Language: {item.language}</div>
                )}
              </div>
              <div className="item-content">
                <pre>{item.content}</pre>
              </div>
            </div>

            {/* Backlinks Section */}
            <div className="backlinks-section">
              <h3>🔗 Backlinks</h3>
              {connections.filter(c => c.toItemId === id).length === 0 ? (
                <p className="empty-state">No items link to this one.</p>
              ) : (
                <div className="backlinks-list">
                  {connections
                    .filter(c => c.toItemId === id)
                    .map(conn => {
                      const fromItem = allItems.find(i => i.id === conn.fromItemId);
                      if (!fromItem) return null;
                      return (
                        <div key={conn.id} className="backlink-item">
                          <Link to={`/knowledge/item/${fromItem.id}`} className="backlink-link">
                            <span className="backlink-type">{conn.type}</span>
                            {getTypeIcon(fromItem.type)} {fromItem.title}
                          </Link>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Connections Section */}
            <div className="connections-section">
              <h3>🔗 Connected Knowledge</h3>
              {connections.length === 0 ? (
                <p className="empty-state">No connections yet. Connect this item to other knowledge.</p>
              ) : (
                <div className="connections-list">
                  {connections.map(conn => {
                    const connectedItem = getConnectedItem(conn);
                    return (
                      <div key={conn.id} className="connection-item">
                        <Link to={`/knowledge/item/${connectedItem.id}`} className="connection-link">
                          <span className="connection-type">{conn.type}</span>
                          {getTypeIcon(connectedItem.type)} {connectedItem.title}
                        </Link>
                        <button onClick={() => handleDeleteConnection(conn.id)} className="remove-connection">
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Connect Modal */}
        {showConnect && (
          <div className="modal-overlay" onClick={() => setShowConnect(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Connect to Another Item</h2>
              <form onSubmit={handleConnect}>
                <div className="form-group">
                  <label>Select Item</label>
                  <select
                    value={selectedConnectItem}
                    onChange={(e) => setSelectedConnectItem(e.target.value)}
                    required
                  >
                    <option value="">Select an item...</option>
                    {allItems.map(i => (
                      <option key={i.id} value={i.id}>
                        {getTypeIcon(i.type)} {i.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Connection Type</label>
                  <select
                    value={connectType}
                    onChange={(e) => setConnectType(e.target.value)}
                  >
                    <option value="RELATED">Related</option>
                    <option value="PARENT_OF">Parent Of</option>
                    <option value="CHILD_OF">Child Of</option>
                    <option value="DEPENDS_ON">Depends On</option>
                    <option value="PREREQUISITE">Prerequisite</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => setShowConnect(false)} className="cancel-button">Cancel</button>
                  <button type="submit" className="primary-button">Connect</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}