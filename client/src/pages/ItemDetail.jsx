import NexusLoader from '../components/NexusLoader';
import '../components/NexusLoader.css';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Bot, BookOpen, Network, BarChart3, Tags as TagsIcon, Sun, Moon,
  FileText, Link2, Code2, Lightbulb, Library,
  Edit3, Trash2, Share2, Star, Plus, X, AlertTriangle, Sparkles,
  Save, ArrowLeft, Link as LinkIcon,
} from 'lucide-react';
import * as api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useKnowledgeShortcuts } from '../hooks/useKnowledgeShortcuts';
import ConfirmDialog from '../components/ConfirmDialog';
import MarkdownRenderer from '../components/MarkdownRenderer';
import HeaderShortcutsButton from '../components/HeaderShortcutsButton';
import CustomSelect from '../components/CustomSelect';

const ITEM_ICONS = {
  NOTE: FileText,
  BOOKMARK: Link2,
  CODE: Code2,
  IDEA: Lightbulb,
  RESOURCE: Library,
};

// Keep the loader on screen for at least this long,
// so the snake animation always has time to finish.
const MIN_LOADER_MS = 1400;

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const { showToast } = useToast();

  useKnowledgeShortcuts({
    onCreate: () => navigate('/knowledge/create'),
    onSearch: () => navigate('/knowledge'),
    onDashboard: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    onGraph: () => navigate('/knowledge/graph'),
    onToggleTheme: toggleDarkMode,
  });

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minLoadTimePassed, setMinLoadTimePassed] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [connections, setConnections] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [showConnect, setShowConnect] = useState(false);
  const [selectedConnectItem, setSelectedConnectItem] = useState('');
  const [connectType, setConnectType] = useState('RELATED');
  const [useMarkdown, setUseMarkdown] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteConn, setConfirmDeleteConn] = useState(null);

  // Minimum loader display time — lets the snake animation finish.
  useEffect(() => {
    const t = setTimeout(() => setMinLoadTimePassed(true), MIN_LOADER_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    fetchItem();
    fetchConnections();
    fetchAllItems();
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await api.getItem(id);
      setItem(response.data);
      const content = response.data.content || '';
      const isMarkdown =
        content.startsWith('#') ||
        content.includes('```') ||
        content.includes('**') ||
        (content.includes('[') && content.includes('](')) ||
        content.includes('> ');
      setUseMarkdown(isMarkdown);
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
      setAllItems(response.data.filter((i) => i.id !== id));
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
      showToast('Item updated successfully', 'success');
    } catch (error) {
      setError('Failed to update item');
      showToast('Failed to update item', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.deleteItem(id);
      showToast('Item deleted successfully', 'success');
      navigate('/knowledge');
    } catch (error) {
      setError('Failed to delete item');
      showToast('Failed to delete item', 'error');
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    setConnectError('');

    if (!selectedConnectItem) {
      setConnectError('Please select an item to connect to');
      return;
    }

    if (selectedConnectItem === id) {
      setConnectError('Cannot connect an item to itself');
      return;
    }

    const selectedItem = allItems.find((i) => i.id === selectedConnectItem);
    if (!selectedItem) {
      setConnectError('Selected item not found');
      return;
    }

    try {
      await api.createConnection({
        fromItemId: id,
        toItemId: selectedConnectItem,
        type: connectType,
      });
      setShowConnect(false);
      setSelectedConnectItem('');
      setConnectType('RELATED');
      await fetchConnections();
      showToast('Connection created!', 'success');
    } catch (error) {
      console.error('Connection error:', error);
      setConnectError(
        error.response?.data?.error || 'Failed to create connection'
      );
    }
  };

  const handleDeleteConnection = async () => {
    if (!confirmDeleteConn) return;
    try {
      await api.deleteConnection(confirmDeleteConn);
      fetchConnections();
      showToast('Connection removed', 'success');
    } catch (error) {
      showToast('Failed to remove connection', 'error');
    } finally {
      setConfirmDeleteConn(null);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/knowledge/item/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard!', 'success');
    } catch (error) {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('Link copied to clipboard!', 'success');
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const newState = !item.favorite;
      await api.updateItem(id, {
        title: item.title,
        content: item.content,
        type: item.type,
        url: item.url,
        language: item.language,
        favorite: newState,
        tagIds: item.tags ? item.tags.map((t) => t.id) : [],
      });
      setItem({ ...item, favorite: newState });
      showToast(
        newState ? 'Added to favorites' : 'Removed from favorites',
        'success'
      );
    } catch (error) {
      showToast('Failed to update favorite', 'error');
    }
  };

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    setShowSuggestions(true);
    try {
      const response = await api.suggestConnections(id);
      setSuggestions(response.data.suggestions || []);
      if (response.data.suggestions?.length === 0) {
        showToast('No suggestions found', 'info');
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      showToast('Failed to generate suggestions', 'error');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAcceptSuggestion = async (suggestion) => {
    try {
      await api.createConnection({
        fromItemId: id,
        toItemId: suggestion.item.id,
        type: 'RELATED',
      });
      setSuggestions(suggestions.filter((s) => s.item.id !== suggestion.item.id));
      fetchConnections();
      showToast('Connection added!', 'success');
    } catch (error) {
      showToast('Failed to add connection', 'error');
    }
  };

  const handleDismissSuggestion = (suggestionId) => {
    setSuggestions(suggestions.filter((s) => s.item.id !== suggestionId));
  };

  const toggleMarkdown = () => setUseMarkdown(!useMarkdown);

  const getTypeIcon = (type, size = 14) => {
    const Icon = ITEM_ICONS[type] || FileText;
    return <Icon size={size} strokeWidth={2.2} />;
  };

  const getConnectedItem = (connection) => {
    return connection.fromItemId === id
      ? connection.toItem
      : connection.fromItem;
  };

  // Show loader until BOTH:
  //   1. the item fetch completes, AND
  //   2. the minimum display time has passed
  if (loading || !minLoadTimePassed)
    return (
      <div className="knowledge-page">
        <div className="knowledge-header">
          <div className="knowledge-header-content">
            <div className="knowledge-logo">NEXUS</div>
          </div>
        </div>
        <NexusLoader isVisible={true} duration={MIN_LOADER_MS} fullscreen={false} />
      </div>
    );

  if (error)
    return (
      <div className="knowledge-page">
        <div className="knowledge-header">
          <div className="knowledge-header-content">
            <div className="knowledge-logo">NEXUS</div>
          </div>
        </div>
        <div className="error-message" style={{ margin: '20px' }}>
          <AlertTriangle size={20} /> {error}
        </div>
      </div>
    );

  if (!item)
    return (
      <div className="knowledge-page">
        <div className="error-message" style={{ margin: '20px' }}>
          Item not found
        </div>
      </div>
    );

  return (
    <div className="knowledge-page page-transition">
      <header className="knowledge-header">
        <div className="knowledge-header-content">
          <div className="knowledge-logo">NEXUS</div>
          <div className="knowledge-header-actions">
            <div className="nav-group">
              <Link to="/ai-builder" className="nav-link" title="AI Product Builder">
                <Bot size={16} /> AI
              </Link>
              <Link to="/knowledge" className="nav-link" title="Knowledge Dashboard">
                <BookOpen size={16} /> Dashboard
              </Link>
              <Link to="/knowledge/graph" className="nav-link" title="Knowledge Graph">
                <Network size={16} /> Graph
              </Link>
              <Link to="/knowledge/stats" className="nav-link" title="Statistics">
                <BarChart3 size={16} /> Stats
              </Link>
              <Link to="/knowledge/tags" className="nav-link" title="Tag Manager">
                <TagsIcon size={16} /> Tags
              </Link>
            </div>
            <div className="header-user-group">
              <HeaderShortcutsButton />
              <button
                className="theme-toggle-small"
                onClick={toggleDarkMode}
                title="Toggle theme"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="item-detail-page">
        <div className="page-header">
          <Link to="/knowledge" className="back-link">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <h1>{isEditing ? 'Edit Item' : item.title}</h1>
          <div className="header-actions">
            {!isEditing && (
              <>
                <button
                  onClick={handleToggleFavorite}
                  className={`favorite-btn-large ${item.favorite ? 'active' : ''}`}
                  title={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star size={18} fill={item.favorite ? 'currentColor' : 'none'} />
                </button>
                <button onClick={() => setIsEditing(true)} className="edit-button">
                  <Edit3 size={14} /> Edit
                </button>
                <button onClick={handleShare} className="share-button">
                  <Share2 size={14} /> Share
                </button>
                <button onClick={() => setConfirmDelete(true)} className="delete-button">
                  <Trash2 size={14} /> Delete
                </button>
                <button onClick={() => setShowConnect(true)} className="connect-button">
                  <LinkIcon size={14} /> Connect
                </button>
                <button onClick={fetchSuggestions} className="suggest-button">
                  <Sparkles size={14} /> Suggest
                </button>
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
                onChange={(e) => setItem({ ...item, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <CustomSelect
                value={item.type}
                onChange={(e) => setItem({ ...item, type: e.target.value })}
                options={[
                  { value: 'NOTE', label: 'Note' },
                  { value: 'BOOKMARK', label: 'Bookmark' },
                  { value: 'CODE', label: 'Code Snippet' },
                  { value: 'IDEA', label: 'Idea' },
                  { value: 'RESOURCE', label: 'Resource' },
                ]}
              />
            </div>
            <div className="form-group">
              <div className="markdown-toggle-wrapper">
                <label>Content</label>
                <button
                  type="button"
                  className={`markdown-toggle-btn ${useMarkdown ? 'active' : ''}`}
                  onClick={toggleMarkdown}
                >
                  <FileText size={14} />
                  {useMarkdown ? ' Markdown Enabled' : ' Plain Text'}
                </button>
              </div>
              <textarea
                value={item.content}
                onChange={(e) => setItem({ ...item, content: e.target.value })}
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
                  onChange={(e) => setItem({ ...item, url: e.target.value })}
                />
              </div>
            )}
            {item.type === 'CODE' && (
              <div className="form-group">
                <label>Language</label>
                <input
                  type="text"
                  value={item.language || ''}
                  onChange={(e) => setItem({ ...item, language: e.target.value })}
                />
              </div>
            )}
            <div className="form-actions">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="item-detail-content">
              <div className="item-meta-detail">
                <span
                  className={`item-type-badge item-type-${item.type.toLowerCase()}`}
                >
                  {getTypeIcon(item.type, 14)} {item.type}
                </span>
                {item.tags && item.tags.length > 0 && (
                  <div className="item-tags-detail">
                    {item.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="tag"
                        style={{ backgroundColor: tag.color || '#6366f1' }}
                      >
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
                    <Link2 size={14} />{' '}
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.url}
                    </a>
                  </div>
                )}
                {item.language && (
                  <div className="item-language">
                    <Code2 size={14} /> Language: {item.language}
                  </div>
                )}
              </div>
              <div className="item-content">
                {useMarkdown ? (
                  <MarkdownRenderer content={item.content} />
                ) : (
                  <pre>{item.content}</pre>
                )}
              </div>
            </div>

            {showSuggestions && (
              <div className="suggestions-panel">
                <div className="suggestions-header">
                  <Sparkles size={20} />
                  <h3>AI Suggestions</h3>
                  <button
                    onClick={() => setShowSuggestions(false)}
                    style={{
                      marginLeft: 'auto',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {loadingSuggestions ? (
                  <p className="empty-state">Analyzing your knowledge base...</p>
                ) : suggestions.length === 0 ? (
                  <p className="empty-state">
                    No suggestions available. You may already be well connected!
                  </p>
                ) : (
                  <div>
                    {suggestions.map((sugg) => (
                      <div key={sugg.item.id} className="suggestion-item">
                        <div className="suggestion-info">
                          <div className="suggestion-title">
                            {getTypeIcon(sugg.item.type)} {sugg.item.title}
                          </div>
                          <div className="suggestion-reason">
                            {sugg.reason} ·{' '}
                            {Math.round(sugg.confidence * 100)}% confidence
                          </div>
                        </div>
                        <div className="suggestion-actions">
                          <button
                            className="suggestion-connect-btn"
                            onClick={() => handleAcceptSuggestion(sugg)}
                          >
                            <Plus size={12} /> Connect
                          </button>
                          <button
                            className="suggestion-dismiss-btn"
                            onClick={() => handleDismissSuggestion(sugg.item.id)}
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="backlinks-section">
              <h3>
                <LinkIcon size={18} /> Backlinks
              </h3>
              {connections.filter((c) => c.toItemId === id).length === 0 ? (
                <p className="empty-state">No items link to this one.</p>
              ) : (
                <div className="backlinks-list">
                  {connections
                    .filter((c) => c.toItemId === id)
                    .map((conn) => {
                      const fromItem = allItems.find(
                        (i) => i.id === conn.fromItemId
                      );
                      if (!fromItem) return null;
                      return (
                        <div key={conn.id} className="backlink-item">
                          <Link
                            to={`/knowledge/item/${fromItem.id}`}
                            className="backlink-link"
                          >
                            <span className="backlink-type">{conn.type}</span>
                            {getTypeIcon(fromItem.type)} {fromItem.title}
                          </Link>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="connections-section">
              <h3>
                <LinkIcon size={18} /> Connected Knowledge
              </h3>
              {connections.length === 0 ? (
                <p className="empty-state">
                  No connections yet. Connect this item to other knowledge.
                </p>
              ) : (
                <div className="connections-list">
                  {connections.map((conn) => {
                    const connectedItem = getConnectedItem(conn);
                    return (
                      <div key={conn.id} className="connection-item">
                        <Link
                          to={`/knowledge/item/${connectedItem.id}`}
                          className="connection-link"
                        >
                          <span className="connection-type">{conn.type}</span>
                          {getTypeIcon(connectedItem.type)} {connectedItem.title}
                        </Link>
                        <button
                          onClick={() => setConfirmDeleteConn(conn.id)}
                          className="remove-connection"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {showConnect && (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowConnect(false);
              setConnectError('');
              setSelectedConnectItem('');
            }}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>
                <LinkIcon size={20} /> Connect to Another Item
              </h2>

              <p
                style={{
                  marginBottom: '16px',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                }}
              >
                Connecting from: <strong>{item.title}</strong>
              </p>

              {connectError && (
                <div className="error-message" style={{ marginBottom: '16px' }}>
                  <AlertTriangle size={16} /> {connectError}
                </div>
              )}

              <form onSubmit={handleConnect}>
                <div className="form-group">
                  <label>Select Item to Connect To</label>
                  <CustomSelect
                    value={selectedConnectItem}
                    onChange={(e) => setSelectedConnectItem(e.target.value)}
                    placeholder="Select an item..."
                    options={allItems.map((i) => ({
                      value: i.id,
                      label: i.title,
                    }))}
                  />
                </div>

                <div className="form-group">
                  <label>Connection Type</label>
                  <CustomSelect
                    value={connectType}
                    onChange={(e) => setConnectType(e.target.value)}
                    options={[
                      { value: 'RELATED', label: 'Related' },
                      { value: 'PARENT_OF', label: 'Parent Of' },
                      { value: 'CHILD_OF', label: 'Child Of' },
                      { value: 'DEPENDS_ON', label: 'Depends On' },
                      { value: 'PREREQUISITE', label: 'Prerequisite' },
                    ]}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConnect(false);
                      setConnectError('');
                      setSelectedConnectItem('');
                    }}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-button">
                    <LinkIcon size={14} /> Connect
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={confirmDelete}
          title="Delete Item?"
          message={`Are you sure you want to delete "${item.title}"? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(false)}
        />

        <ConfirmDialog
          isOpen={!!confirmDeleteConn}
          title="Remove Connection?"
          message="This will remove the connection between these items."
          confirmText="Remove"
          onConfirm={handleDeleteConnection}
          onCancel={() => setConfirmDeleteConn(null)}
        />
      </div>
    </div>
  );
}