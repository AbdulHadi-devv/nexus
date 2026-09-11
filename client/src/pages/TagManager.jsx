import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import * as api from '../services/api';

export default function TagManager() {
    const [alertDismissed, setAlertDismissed] = useState(false);
    const { user } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();
    const { showToast } = useToast();
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTag, setEditingTag] = useState(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('#6366f1');
    const [mergingTag, setMergingTag] = useState(null);
    const [mergeTarget, setMergeTarget] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#6366f1');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await api.getTags();
      setTags(response.data);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      showToast('Failed to load tags', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTagName.trim()) {
      showToast('Tag name cannot be empty', 'error');
      return;
    }

    try {
      await api.createTag({
        name: newTagName.trim(),
        color: newTagColor,
      });
      showToast(`Created #${newTagName.trim()}`, 'success');
      setShowCreate(false);
      setNewTagName('');
      setNewTagColor('#6366f1');
      fetchTags();
    } catch (error) {
      console.error('Create failed:', error);
      showToast(error.response?.data?.error || 'Failed to create tag', 'error');
    }
  };

  const handleRename = async () => {
    if (!editName.trim()) {
      showToast('Tag name cannot be empty', 'error');
      return;
    }

    try {
      await api.updateTag(editingTag.id, {
        name: editName.trim(),
        color: editColor,
      });
      showToast(`Renamed to #${editName.trim()}`, 'success');
      setEditingTag(null);
      fetchTags();
    } catch (error) {
      console.error('Rename failed:', error);
      showToast(error.response?.data?.error || 'Failed to rename tag', 'error');
    }
  };

  const handleMerge = async () => {
    if (!mergeTarget) {
      showToast('Please select a tag to merge into', 'error');
      return;
    }

    if (mergeTarget === mergingTag.id) {
      showToast('Cannot merge a tag into itself', 'error');
      return;
    }

    const targetTag = tags.find(t => t.id === mergeTarget);
    const itemCount = mergingTag.items?.length || 0;

    try {
      const response = await api.mergeTags(mergingTag.id, mergeTarget);
      showToast(
        `Merged #${mergingTag.name} (${itemCount} items) into #${targetTag.name}`,
        'success'
      );
      setMergingTag(null);
      setMergeTarget('');
      fetchTags();
    } catch (error) {
      console.error('Merge failed:', error);
      showToast(error.response?.data?.error || 'Failed to merge tags', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      await api.deleteTag(confirmDelete.id);
      showToast(`Deleted #${confirmDelete.name}`, 'success');
      setConfirmDelete(null);
      fetchTags();
    } catch (error) {
      console.error('Delete failed:', error);
      showToast('Failed to delete tag', 'error');
    }
  };

  const handleCleanupUnused = async () => {
    const unused = tags.filter(t => !t.items || t.items.length === 0);
    if (unused.length === 0) return;

    try {
      await Promise.all(unused.map(tag => api.deleteTag(tag.id)));
      showToast(`Deleted ${unused.length} unused tag${unused.length > 1 ? 's' : ''}`, 'success');
      fetchTags();
    } catch (error) {
      console.error('Cleanup failed:', error);
      showToast('Failed to delete some tags', 'error');
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unusedTags = tags.filter(tag => !tag.items || tag.items.length === 0);
  const usedTagsCount = tags.filter(tag => tag.items && tag.items.length > 0).length;

  const colorPresets = [
    '#6366f1', '#ec4899', '#10b981', '#f59e0b',
    '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'
  ];

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
            <Link to="/knowledge/stats" className="nav-link">📊 Stats</Link>
            <span className="nav-link active">🏷️ Tags</span>
            <button
              className="theme-toggle-small"
              onClick={toggleDarkMode}
              title="Toggle theme"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <div className="tag-manager-page">
        {/* Page Header */}
        <div className="tag-manager-header">
          <div>
            <h1>🏷️ Tag Manager</h1>
            <p>Create, rename, merge, and clean up your tags</p>
          </div>
          <button
            className="primary-button"
            onClick={() => setShowCreate(true)}
          >
            + Create Tag
          </button>
        </div>

        {/* Stats */}
        <div className="tag-stats-bar">
          <div className="tag-stat-card">
            <span className="tag-stat-value">{tags.length}</span>
            <span className="tag-stat-label">Total Tags</span>
          </div>
          <div className="tag-stat-card">
            <span className="tag-stat-value">{usedTagsCount}</span>
            <span className="tag-stat-label">In Use</span>
          </div>
          <div className="tag-stat-card">
            <span className="tag-stat-value">{unusedTags.length}</span>
            <span className="tag-stat-label">Unused</span>
          </div>
        </div>

        {/* Unused tags alert */}
        {unusedTags.length > 0 && !alertDismissed && (
            <div className="unused-tags-alert">
                <span className="alert-icon">⚠️</span>
                <span className="alert-message">
                You have <strong>{unusedTags.length}</strong> unused tag{unusedTags.length > 1 ? 's' : ''}.
                Consider cleaning them up.
                </span>
                <button className="alert-action" onClick={handleCleanupUnused}>
                Clean Up
                </button>
                <button
                className="alert-dismiss"
                onClick={() => setAlertDismissed(true)}
                title="Dismiss"
                >
                ✕
                </button>
            </div>
        )}

        {/* Search */}
        <div className="tag-search">
          <input
            type="text"
            placeholder="🔍 Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tag-search-input"
          />
        </div>

        {/* Tag List */}
        {loading ? (
          <div className="loading-state">Loading tags...</div>
        ) : filteredTags.length === 0 ? (
          <div className="empty-state-container">
            <div className="empty-state">
              <div className="empty-icon">🏷️</div>
              <h3>
                {searchQuery ? 'No tags match your search' : 'No tags yet'}
              </h3>
              <p>
                {searchQuery
                  ? 'Try a different search term.'
                  : 'Create your first tag to get started.'}
              </p>
              {!searchQuery && (
                <button
                  className="primary-button"
                  onClick={() => setShowCreate(true)}
                >
                  + Create Your First Tag
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="tag-list">
            {filteredTags.map(tag => (
              <div key={tag.id} className="tag-row">
                <div className="tag-row-left">
                  <span
                    className="tag-color-dot"
                    style={{ backgroundColor: tag.color || '#6366f1' }}
                  />
                  <span className="tag-row-name">#{tag.name}</span>
                  <span className="tag-row-count">
                    {tag.items?.length || 0} item{tag.items?.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="tag-row-actions">
                  <button
                    className="tag-action-btn"
                    onClick={() => {
                      setEditingTag(tag);
                      setEditName(tag.name);
                      setEditColor(tag.color || '#6366f1');
                    }}
                    title="Rename"
                  >
                    ✏️
                  </button>
                  <button
                    className="tag-action-btn"
                    onClick={() => {
                      setMergingTag(tag);
                      setMergeTarget('');
                    }}
                    title="Merge"
                    disabled={tags.length < 2}
                  >
                    🔀
                  </button>
                  <button
                    className="tag-action-btn tag-action-delete"
                    onClick={() => setConfirmDelete(tag)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>✨ Create New Tag</h2>

            <div className="form-group">
              <label>Tag Name</label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g., javascript, ideas, work"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
              />
            </div>

            <div className="form-group">
              <label>Color</label>
              <div className="color-picker-row">
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="color-input"
                />
                <div className="color-presets">
                  {colorPresets.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-preset ${newTagColor === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTagColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="tag-preview">
              <span className="card-label">PREVIEW</span>
              <div>
                <span
                  className="tag"
                  style={{ backgroundColor: newTagColor }}
                >
                  #{newTagName || 'tag-name'}
                </span>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setShowCreate(false);
                  setNewTagName('');
                  setNewTagColor('#6366f1');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleCreate}
              >
                Create Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {editingTag && (
        <div className="modal-overlay" onClick={() => setEditingTag(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>✏️ Rename Tag</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              Renaming <strong>#{editingTag.name}</strong> will update{' '}
              {editingTag.items?.length || 0} item(s).
            </p>

            <div className="form-group">
              <label>Tag Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Tag name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                }}
              />
            </div>

            <div className="form-group">
              <label>Color</label>
              <div className="color-picker-row">
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="color-input"
                />
                <div className="color-presets">
                  {colorPresets.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-preset ${editColor === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setEditingTag(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleRename}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {mergingTag && (
        <div className="modal-overlay" onClick={() => {
          setMergingTag(null);
          setMergeTarget('');
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>🔀 Merge Tag</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              Merging <strong>#{mergingTag.name}</strong> ({mergingTag.items?.length || 0} items)
              into another tag will combine all items and delete the source tag.
            </p>

            <div className="form-group">
              <label>Merge Into</label>
              <select
                value={mergeTarget}
                onChange={(e) => setMergeTarget(e.target.value)}
                autoFocus
              >
                <option value="">Select a tag...</option>
                {tags
                  .filter(t => t.id !== mergingTag.id)
                  .map(t => (
                    <option key={t.id} value={t.id}>
                      #{t.name} ({t.items?.length || 0} items)
                    </option>
                  ))}
              </select>
            </div>

            {mergeTarget && (
              <div className="merge-preview">
                <div className="merge-preview-row">
                  <span className="merge-from">
                    <span
                      className="tag"
                      style={{ backgroundColor: mergingTag.color || '#6366f1' }}
                    >
                      #{mergingTag.name}
                    </span>
                  </span>
                  <span className="merge-arrow">→</span>
                  <span className="merge-to">
                    <span
                      className="tag"
                      style={{
                        backgroundColor:
                          tags.find(t => t.id === mergeTarget)?.color || '#6366f1',
                      }}
                    >
                      #{tags.find(t => t.id === mergeTarget)?.name}
                    </span>
                  </span>
                </div>
                <p className="merge-note">
                  {mergingTag.items?.length || 0} item(s) will be tagged
                  with <strong>#{tags.find(t => t.id === mergeTarget)?.name}</strong>
                </p>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setMergingTag(null);
                  setMergeTarget('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleMerge}
                disabled={!mergeTarget}
              >
                Merge Tags
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Tag?"
        message={`Delete #${confirmDelete?.name}? It will be removed from ${confirmDelete?.items?.length || 0} item(s). This cannot be undone.`}
        confirmText="Delete"
        icon="🏷️"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}