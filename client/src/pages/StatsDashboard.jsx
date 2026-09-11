import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as api from '../services/api';

export default function StatsDashboard() {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const getTypeIcon = (type) => {
    const icons = {
      NOTE: '📝', BOOKMARK: '🔗', CODE: '💻',
      IDEA: '💡', RESOURCE: '📚'
    };
    return icons[type] || '📄';
  };

  const getTypeColor = (type) => {
    const colors = {
      NOTE: '#6366f1', BOOKMARK: '#f59e0b', CODE: '#10b981',
      IDEA: '#ec4899', RESOURCE: '#3b82f6'
    };
    return colors[type] || '#6366f1';
  };

  const stats = {
    totalItems: items.length,
    totalConnections: Math.floor(items.reduce((acc, item) => {
      return acc + (item.connectionsFrom?.length || 0) + (item.connectionsTo?.length || 0);
    }, 0) / 2),
    totalTags: new Set(items.flatMap(i => i.tags?.map(t => t.id) || [])).size,
    totalFavorites: items.filter(i => i.favorite).length,
  };

  const byType = {
    NOTE: items.filter(i => i.type === 'NOTE').length,
    BOOKMARK: items.filter(i => i.type === 'BOOKMARK').length,
    CODE: items.filter(i => i.type === 'CODE').length,
    IDEA: items.filter(i => i.type === 'IDEA').length,
    RESOURCE: items.filter(i => i.type === 'RESOURCE').length,
  };

  const tagFrequency = {};
  items.forEach(item => {
    item.tags?.forEach(tag => {
      tagFrequency[tag.name] = (tagFrequency[tag.name] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentItems = items.filter(i => new Date(i.createdAt) >= sevenDaysAgo).length;

  const activityByDay = {};
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    activityByDay[date.toISOString().split('T')[0]] = 0;
  }
  items.forEach(item => {
    const key = new Date(item.createdAt).toISOString().split('T')[0];
    if (activityByDay[key] !== undefined) activityByDay[key]++;
  });
  const maxActivity = Math.max(...Object.values(activityByDay), 1);

  const topConnected = items
    .map(item => ({
      ...item,
      connectionCount: (item.connectionsFrom?.length || 0) + (item.connectionsTo?.length || 0),
    }))
    .sort((a, b) => b.connectionCount - a.connectionCount)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="knowledge-page">
        <div className="knowledge-header">
          <div className="knowledge-header-content">
            <div className="knowledge-logo">NEXUS</div>
          </div>
        </div>
        <div className="loading-state">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className="knowledge-page page-transition">
      <header className="knowledge-header">
        <div className="knowledge-header-content">
          <div className="knowledge-logo">NEXUS</div>
          <div className="knowledge-header-actions">
            <div className="nav-group">
              <Link to="/ai-builder" className="nav-link">🤖 AI</Link>
              <Link to="/knowledge" className="nav-link">📚 Dashboard</Link>
              <Link to="/knowledge/graph" className="nav-link">🕸️ Graph</Link>
              <span className="nav-link active">📊 Stats</span>
              <Link to="/knowledge/tags" className="nav-link">🏷️ Tags</Link>
            </div>
            <div className="header-user-group">
              <span className="user-name">👤 {user?.name}</span>
              <button
                className="theme-toggle-small"
                onClick={toggleDarkMode}
                title="Toggle theme"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="stats-page">
        <div className="stats-page-header">
          <h1>📊 Knowledge Statistics</h1>
          <p>Insights into your knowledge base</p>
        </div>

        <div className="stats-summary-grid">
          <div className="stats-summary-card">
            <span className="stats-summary-icon">📚</span>
            <div>
              <div className="stats-summary-number">{stats.totalItems}</div>
              <div className="stats-summary-label">Total Items</div>
            </div>
          </div>
          <div className="stats-summary-card">
            <span className="stats-summary-icon">🔗</span>
            <div>
              <div className="stats-summary-number">{stats.totalConnections}</div>
              <div className="stats-summary-label">Connections</div>
            </div>
          </div>
          <div className="stats-summary-card">
            <span className="stats-summary-icon">🏷️</span>
            <div>
              <div className="stats-summary-number">{stats.totalTags}</div>
              <div className="stats-summary-label">Unique Tags</div>
            </div>
          </div>
          <div className="stats-summary-card">
            <span className="stats-summary-icon">⭐</span>
            <div>
              <div className="stats-summary-number">{stats.totalFavorites}</div>
              <div className="stats-summary-label">Favorites</div>
            </div>
          </div>
          <div className="stats-summary-card">
            <span className="stats-summary-icon">🔥</span>
            <div>
              <div className="stats-summary-number">{recentItems}</div>
              <div className="stats-summary-label">Added This Week</div>
            </div>
          </div>
        </div>

        <div className="stats-section">
          <h2>📋 Items by Type</h2>
          <div className="type-breakdown">
            {Object.entries(byType).map(([type, count]) => {
              const percentage = stats.totalItems > 0
                ? Math.round((count / stats.totalItems) * 100)
                : 0;
              return (
                <div key={type} className="type-row">
                  <span className="type-label">
                    {getTypeIcon(type)} {type}
                  </span>
                  <div className="type-bar-container">
                    <div
                      className="type-bar"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: getTypeColor(type),
                      }}
                    />
                  </div>
                  <span className="type-count">{count} ({percentage}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="stats-section">
          <h2>📈 Activity (Last 30 Days)</h2>
          <div className="activity-chart">
            {Object.entries(activityByDay).map(([date, count]) => (
              <div
                key={date}
                className="activity-bar"
                style={{ height: `${(count / maxActivity) * 100}%` }}
                title={`${date}: ${count} items`}
              >
                {count > 0 && <span className="activity-count">{count}</span>}
              </div>
            ))}
          </div>
          <div className="activity-labels">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>

        <div className="stats-section">
          <h2>🏷️ Top Tags</h2>
          {topTags.length === 0 ? (
            <p className="empty-state">No tags yet.</p>
          ) : (
            <div className="top-tags">
              {topTags.map(([tagName, count]) => (
                <div key={tagName} className="top-tag-item">
                  <span className="top-tag-name">#{tagName}</span>
                  <span className="top-tag-count">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="stats-section">
          <h2>🔗 Most Connected Items</h2>
          {topConnected.length === 0 || topConnected[0].connectionCount === 0 ? (
            <p className="empty-state">No connections yet.</p>
          ) : (
            <div className="top-connected">
              {topConnected.map((item, index) => (
                <Link
                  key={item.id}
                  to={`/knowledge/item/${item.id}`}
                  className="top-connected-item"
                >
                  <span className="top-connected-rank">#{index + 1}</span>
                  <span className="top-connected-icon">{getTypeIcon(item.type)}</span>
                  <span className="top-connected-title">{item.title}</span>
                  <span className="top-connected-count">
                    {item.connectionCount} connections
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}