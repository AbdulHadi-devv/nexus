import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Brain, BookOpen, Network, BarChart3, Tags, Bot, Sun, Moon, LogOut,
  FileText, Link2, Code2, Lightbulb, Library,
  Plus, Search, X, Star, Download, Upload, Trash2, BookMarked, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useKnowledgeShortcuts } from '../hooks/useKnowledgeShortcuts';
import ConfirmDialog from '../components/ConfirmDialog';
import BackToTop from '../components/BackToTop';
import ImportModal from '../components/ImportModal';
import HeaderShortcutsButton from '../components/HeaderShortcutsButton';
import { ItemGridSkeleton, StatCardSkeleton } from '../components/Skeletons';
import * as api from '../services/api';

const ITEM_ICONS = {
  NOTE: FileText,
  BOOKMARK: Link2,
  CODE: Code2,
  IDEA: Lightbulb,
  RESOURCE: Library,
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    itemId: null,
    itemTitle: '',
  });

  useEffect(() => {
    fetchItems();
  }, []);

  useKnowledgeShortcuts({
    onCreate: () => navigate('/knowledge/create'),
    onSearch: () => searchInputRef.current?.focus(),
    onDashboard: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    onGraph: () => navigate('/knowledge/graph'),
    onToggleTheme: toggleDarkMode,
  });

  const fetchItems = async () => {
    try {
      const response = await api.getItems();
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      showToast('Failed to load items', 'error');
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
      showToast(`Found ${response.data.items?.length || 0} results`, 'info');
    } catch (error) {
      console.error('Search failed:', error);
      showToast('Search failed', 'error');
    }
  };

  const handleDeleteClick = (item) => {
    setConfirmState({
      isOpen: true,
      itemId: item.id,
      itemTitle: item.title,
    });
  };

  const confirmDelete = async () => {
    try {
      await api.deleteItem(confirmState.itemId);
      setItems(items.filter(item => item.id !== confirmState.itemId));
      if (searchResults) {
        setSearchResults({
          ...searchResults,
          items: searchResults.items.filter(item => item.id !== confirmState.itemId),
        });
      }
      showToast('Item deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete:', error);
      showToast('Failed to delete item', 'error');
    } finally {
      setConfirmState({ isOpen: false, itemId: null, itemTitle: '' });
    }
  };

  const handleToggleFavorite = async (item, e) => {
    e.preventDefault();
    e.stopPropagation();

    const newFavoriteState = !item.favorite;

    setItems(items.map(i =>
      i.id === item.id ? { ...i, favorite: newFavoriteState } : i
    ));

    try {
      await api.updateItem(item.id, {
        title: item.title,
        content: item.content,
        type: item.type,
        url: item.url,
        language: item.language,
        favorite: newFavoriteState,
        tagIds: item.tags ? item.tags.map(t => t.id) : [],
      });

      showToast(
        newFavoriteState ? 'Added to favorites' : 'Removed from favorites',
        'success'
      );
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      setItems(items.map(i =>
        i.id === item.id ? { ...i, favorite: item.favorite } : i
      ));
      showToast('Failed to update favorite', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'info');
    navigate('/login');
  };

  const handleExport = () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        user: { name: user?.name, email: user?.email },
        items: items.map(item => ({
          ...item,
          connectionsFrom: undefined,
          connectionsTo: undefined,
        })),
      };

      const blob = new Blob(
        [JSON.stringify(exportData, null, 2)],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nexus-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Knowledge exported successfully!', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Failed to export', 'error');
    }
  };

  const getTypeIcon = (type, size = 14) => {
    const Icon = ITEM_ICONS[type] || FileText;
    return <Icon size={size} strokeWidth={2.2} />;
  };

  const getDisplayItems = () => {
    let display = items;

    if (searchResults) {
      display = searchResults.items || [];
    }

    if (filterType !== 'all') {
      display = display.filter(item => item.type === filterType);
    }

    if (showFavoritesOnly) {
      display = display.filter(item => item.favorite);
    }

    return display;
  };

  const displayItems = getDisplayItems();

  const totalItems = items.length;
  const totalConnections = Math.floor(items.reduce((acc, item) => {
    return acc + (item.connectionsFrom?.length || 0) + (item.connectionsTo?.length || 0);
  }, 0) / 2);
  const totalTags = new Set(items.flatMap(i => i.tags?.map(t => t.id) || [])).size;
  const favoriteCount = items.filter(i => i.favorite).length;

  const statCards = [
    { icon: BookMarked, value: totalItems, label: 'Total Items' },
    { icon: Network, value: totalConnections, label: 'Connections' },
    { icon: Tags, value: totalTags, label: 'Tags' },
    { icon: Star, value: favoriteCount, label: 'Favorites' },
    { icon: FileText, value: items.filter(i => i.type === 'NOTE').length, label: 'Notes' },
    { icon: Code2, value: items.filter(i => i.type === 'CODE').length, label: 'Code' },
  ];

  return (
    <div className="knowledge-page page-transition">
      {/* Header */}
      <header className="knowledge-header">
        <div className="knowledge-header-content">
          <div className="knowledge-logo">NEXUS</div>
          <div className="knowledge-header-actions">
            <div className="nav-group">
              <Link to="/ai-builder" className="nav-link" title="AI Product Builder">
                <Bot size={16} /> AI
              </Link>
              <span className="nav-link active" title="Knowledge Dashboard">
                <BookOpen size={16} /> Dashboard
              </span>
              <Link to="/knowledge/graph" className="nav-link" title="Knowledge Graph">
                <Network size={16} /> Graph
              </Link>
              <Link to="/knowledge/stats" className="nav-link" title="Statistics">
                <BarChart3 size={16} /> Stats
              </Link>
              <Link to="/knowledge/tags" className="nav-link" title="Tag Manager">
                <Tags size={16} /> Tags
              </Link>
            </div>
            <div className="header-user-group">
              <span className="user-name" title={user?.name}>
                👤 {user?.name}
              </span>
              <HeaderShortcutsButton />
              <button
                className="theme-toggle-small"
                onClick={toggleDarkMode}
                title="Toggle theme"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={handleLogout}
                className="logout-button"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Statistics */}
        {loading ? (
          <StatCardSkeleton count={6} />
        ) : (
          <div className="knowledge-stats">
            {statCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="stat-card">
                  <span className="stat-icon">
                    <Icon size={22} strokeWidth={2} />
                  </span>
                  <div className="stat-info">
                    <span className="stat-number">{stat.value}</span>
                    <span className="stat-label">{stat.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Primary CTA + Tools */}
        <div className="dashboard-actions-bar">
          <Link
            to="/knowledge/create"
            className="new-item-cta"
            title="Create new item (Alt+N)"
          >
            <div className="new-item-cta-icon">
              <Plus size={22} strokeWidth={2.5} />
            </div>
            <div className="new-item-cta-text">
              <span className="new-item-cta-title">Create New Item</span>
              <span className="new-item-cta-subtitle">
                Add a note, bookmark, code snippet, idea, or resource
              </span>
            </div>
            <ArrowRight size={20} className="new-item-cta-arrow" />
          </Link>

          <div className="dashboard-tools">
            <button
              className={`filter-button ${showFavoritesOnly ? 'active' : ''}`}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              title="Show only favorites"
            >
              <Star size={14} /> Favorites ({favoriteCount})
            </button>
            <button
              className="filter-button"
              onClick={handleExport}
              title="Export all knowledge as JSON backup"
            >
              <Download size={14} /> Export
            </button>
            <button
              className="filter-button"
              onClick={() => setShowImportModal(true)}
              title="Import from JSON backup"
            >
              <Upload size={14} /> Import
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon-inside" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search your knowledge... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <button type="submit" className="search-button">
              <Search size={16} /> Search
            </button>
            {searchResults && (
              <button
                type="button"
                onClick={() => { setSearchResults(null); setSearchQuery(''); }}
                className="clear-search"
              >
                <X size={16} /> Clear
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
            <FileText size={14} /> Notes ({items.filter(i => i.type === 'NOTE').length})
          </button>
          <button
            className={filterType === 'BOOKMARK' ? 'active' : ''}
            onClick={() => setFilterType('BOOKMARK')}
          >
            <Link2 size={14} /> Bookmarks ({items.filter(i => i.type === 'BOOKMARK').length})
          </button>
          <button
            className={filterType === 'CODE' ? 'active' : ''}
            onClick={() => setFilterType('CODE')}
          >
            <Code2 size={14} /> Code ({items.filter(i => i.type === 'CODE').length})
          </button>
          <button
            className={filterType === 'IDEA' ? 'active' : ''}
            onClick={() => setFilterType('IDEA')}
          >
            <Lightbulb size={14} /> Ideas ({items.filter(i => i.type === 'IDEA').length})
          </button>
          <button
            className={filterType === 'RESOURCE' ? 'active' : ''}
            onClick={() => setFilterType('RESOURCE')}
          >
            <Library size={14} /> Resources ({items.filter(i => i.type === 'RESOURCE').length})
          </button>
        </div>

        {/* Items Grid */}
        {loading ? (
          <ItemGridSkeleton count={6} />
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
                <div className="empty-state-container">
                  <div className="empty-state">
                    <div className="empty-icon">
                      {showFavoritesOnly ? (
                        <Star size={64} strokeWidth={1.5} />
                      ) : (
                        <Brain size={64} strokeWidth={1.5} />
                      )}
                    </div>
                    <h3>
                      {showFavoritesOnly
                        ? 'No favorites yet'
                        : 'Your knowledge is empty'}
                    </h3>
                    <p>
                      {showFavoritesOnly
                        ? 'Star items to find them quickly later.'
                        : 'Start by adding your first knowledge item.'}
                    </p>
                    {!showFavoritesOnly && (
                      <Link to="/knowledge/create" className="primary-button">
                        <Plus size={16} /> Create Your First Item
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                displayItems.map((item) => (
                  <div
                    key={item.id}
                    className={`item-card ${item.favorite ? 'favorite' : ''}`}
                  >
                    <div className="item-card-header">
                      <span className={`item-type item-type-${item.type.toLowerCase()}`}>
                        {getTypeIcon(item.type)} {item.type}
                      </span>
                      <div className="item-actions">
                        <button
                          className={`favorite-btn ${item.favorite ? 'active' : ''}`}
                          onClick={(e) => handleToggleFavorite(item, e)}
                          title={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star
                            size={16}
                            fill={item.favorite ? 'currentColor' : 'none'}
                          />
                        </button>
                        <Link
                          to={`/knowledge/item/${item.id}`}
                          className="item-action-link"
                          title="View details"
                        >
                          <BookOpen size={16} />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="item-action-delete"
                          title="Delete item"
                        >
                          <Trash2 size={16} />
                        </button>
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
                      <div className="item-meta">
                        <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
                        {item.url && (
                          <span className="item-url">
                            <Link2 size={12} /> {item.url}
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <BackToTop />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title="Delete Item?"
        message={`Are you sure you want to delete "${confirmState.itemTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmState({ isOpen: false, itemId: null, itemTitle: '' })}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={fetchItems}
      />
    </div>
  );
}