import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function CreateItem() {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'NOTE',
    url: '',
    language: '',
  });

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await api.getTags();
      setTags(response.data);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTagToggle = (tagId) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const response = await api.createTag({
        name: newTagName.trim(),
        color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
      });
      setTags([...tags, response.data]);
      setSelectedTagIds([...selectedTagIds, response.data.id]);
      setNewTagName('');
    } catch (error) {
      console.error('Failed to create tag:', error);
      setError('Failed to create tag');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        ...formData,
        tagIds: selectedTagIds,
      };
      await api.createItem(data);
      navigate('/knowledge');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

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
            <span className="user-name">👤 {user?.name}</span>
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
      <div className="create-page">
        <div className="page-header">
          <Link to="/knowledge" className="back-link">← Dashboard</Link>
          <h1>Create New Knowledge Item</h1>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="What is this knowledge about?"
            />
          </div>

          <div className="form-group">
            <label>Type</label>
            <select name="type" value={formData.type} onChange={handleChange}>
              <option value="NOTE">📝 Note</option>
              <option value="BOOKMARK">🔗 Bookmark</option>
              <option value="CODE">💻 Code Snippet</option>
              <option value="IDEA">💡 Idea</option>
              <option value="RESOURCE">📚 Resource</option>
            </select>
          </div>

          <div className="form-group">
            <label>Content *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows="8"
              placeholder="Write your knowledge content here..."
            />
          </div>

          {formData.type === 'BOOKMARK' && (
            <div className="form-group">
              <label>URL</label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>
          )}

          {formData.type === 'CODE' && (
            <div className="form-group">
              <label>Language</label>
              <input
                type="text"
                name="language"
                value={formData.language}
                onChange={handleChange}
                placeholder="JavaScript, Python, etc."
              />
            </div>
          )}

          <div className="form-group">
            <label>Tags</label>
            <div className="tags-input">
              <div className="existing-tags">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    className={`tag-select ${selectedTagIds.includes(tag.id) ? 'selected' : ''}`}
                    onClick={() => handleTagToggle(tag.id)}
                    style={{ 
                      backgroundColor: selectedTagIds.includes(tag.id) ? tag.color || '#6366f1' : 'transparent',
                      color: selectedTagIds.includes(tag.id) ? 'white' : 'var(--text-secondary)',
                      borderColor: selectedTagIds.includes(tag.id) ? tag.color || '#6366f1' : 'var(--border-color)'
                    }}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
              <div className="add-tag">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="New tag name..."
                  className="tag-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <button type="button" onClick={handleAddTag} className="add-tag-button">
                  + Add Tag
                </button>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Link to="/knowledge" className="cancel-button">Cancel</Link>
            <button type="submit" disabled={loading} className="primary-button">
              {loading ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}