import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bot, BookOpen, Network, BarChart3, Tags as TagsIcon, Sun, Moon,
  FileText, Plus, Save, ArrowLeft, AlertTriangle,
} from 'lucide-react';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useKnowledgeShortcuts } from '../hooks/useKnowledgeShortcuts';
import MarkdownRenderer from '../components/MarkdownRenderer';
import HeaderShortcutsButton from '../components/HeaderShortcutsButton';
import CustomSelect from '../components/CustomSelect';

export default function CreateItem() {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  useKnowledgeShortcuts({
    onCreate: () => {},
    onSearch: () => {},
    onDashboard: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    onGraph: () => navigate('/knowledge/graph'),
    onToggleTheme: toggleDarkMode,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [useMarkdown, setUseMarkdown] = useState(false);
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
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const response = await api.createTag({
        name: newTagName.trim(),
        color:
          '#' +
          Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, '0'),
      });
      setTags([...tags, response.data]);
      setSelectedTagIds([...selectedTagIds, response.data.id]);
      setNewTagName('');
    } catch (error) {
      console.error('Failed to create tag:', error);
      setError('Failed to create tag');
    }
  };

  const toggleMarkdown = () => {
    setUseMarkdown(!useMarkdown);
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
      <header className="knowledge-header">
        <div className="knowledge-header-content">
          <div className="knowledge-logo">NEXUS</div>
          <div className="knowledge-header-actions">
            <div className="nav-group">
              <Link to="/ai-builder" className="nav-link">
                <Bot size={16} /> AI
              </Link>
              <Link to="/knowledge" className="nav-link">
                <BookOpen size={16} /> Dashboard
              </Link>
              <Link to="/knowledge/graph" className="nav-link">
                <Network size={16} /> Graph
              </Link>
              <Link to="/knowledge/stats" className="nav-link">
                <BarChart3 size={16} /> Stats
              </Link>
              <Link to="/knowledge/tags" className="nav-link">
                <TagsIcon size={16} /> Tags
              </Link>
            </div>
            <div className="header-user-group">
              <span className="user-name">👤 {user?.name}</span>
              <HeaderShortcutsButton />
              <button className="theme-toggle-small" onClick={toggleDarkMode}>
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="create-page">
        <div className="page-header">
          <Link to="/knowledge" className="back-link">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <h1>Create New Knowledge Item</h1>
        </div>

        {error && (
          <div className="error-message">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

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
            <CustomSelect
              name="type"
              value={formData.type}
              onChange={handleChange}
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
              <label>Content *</label>
              <button
                type="button"
                className={`markdown-toggle-btn ${useMarkdown ? 'active' : ''}`}
                onClick={toggleMarkdown}
              >
                <FileText size={14} />
                {useMarkdown ? ' Markdown Enabled' : ' Plain Text'}
              </button>
            </div>
            {useMarkdown && (
              <div className="markdown-hint">
                Markdown supported: <strong>bold</strong>, *italic*, `code`,
                [links](url), # headings, - lists, {'>'} quotes
              </div>
            )}
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows="8"
              placeholder={
                useMarkdown
                  ? 'Write your knowledge content with Markdown...'
                  : 'Write your knowledge content here...'
              }
            />
            {useMarkdown && formData.content && (
              <div className="markdown-preview-wrapper">
                <label>Preview</label>
                <div className="markdown-preview">
                  <MarkdownRenderer content={formData.content} />
                </div>
              </div>
            )}
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
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className={`tag-select ${
                      selectedTagIds.includes(tag.id) ? 'selected' : ''
                    }`}
                    onClick={() => handleTagToggle(tag.id)}
                    style={{
                      backgroundColor: selectedTagIds.includes(tag.id)
                        ? tag.color || '#6366f1'
                        : 'transparent',
                      color: selectedTagIds.includes(tag.id)
                        ? 'white'
                        : 'var(--text-secondary)',
                      borderColor: selectedTagIds.includes(tag.id)
                        ? tag.color || '#6366f1'
                        : 'var(--border-color)',
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
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="add-tag-button"
                >
                  <Plus size={14} /> Add Tag
                </button>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Link to="/knowledge" className="cancel-button">
              Cancel
            </Link>
            <button type="submit" disabled={loading} className="primary-button">
              {loading ? (
                'Creating...'
              ) : (
                <>
                  <Save size={16} /> Create Item
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}