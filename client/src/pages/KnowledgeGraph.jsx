import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Network } from 'vis-network/standalone';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function KnowledgeGraph() {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [items, setItems] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const networkRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const itemsRes = await api.getItems();
      setItems(itemsRes.data);
      
      // Get all connections from items
      const allConnections = [];
      itemsRes.data.forEach(item => {
        if (item.connectionsFrom) {
          item.connectionsFrom.forEach(conn => {
            allConnections.push(conn);
          });
        }
        if (item.connectionsTo) {
          item.connectionsTo.forEach(conn => {
            allConnections.push(conn);
          });
        }
      });
      setConnections(allConnections);
      
      // Build graph after data is loaded
      setTimeout(() => buildGraph(itemsRes.data, allConnections), 100);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      NOTE: '#6366f1',
      BOOKMARK: '#f59e0b',
      CODE: '#10b981',
      IDEA: '#ec4899',
      RESOURCE: '#3b82f6'
    };
    return colors[type] || '#6366f1';
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

  const buildGraph = (itemsData, connectionsData) => {
    if (!containerRef.current) return;

    const nodes = itemsData.map(item => ({
      id: item.id,
      label: item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title,
      title: `${getTypeIcon(item.type)} ${item.title}\n${item.content?.substring(0, 100)}...`,
      color: {
        background: getTypeColor(item.type),
        border: getTypeColor(item.type),
        highlight: {
          background: getTypeColor(item.type),
          border: '#ffffff'
        }
      },
      font: {
        color: '#ffffff',
        size: 14,
        face: 'Inter'
      },
      shape: 'dot',
      size: 20,
      value: (item.tags?.length || 1) + 1,
      borderWidth: 2,
      shadow: true
    }));

    const edges = connectionsData.map(conn => ({
      id: conn.id,
      from: conn.fromItemId,
      to: conn.toItemId,
      label: conn.type || 'RELATED',
      color: {
        color: '#94a3b8',
        highlight: '#6366f1'
      },
      font: {
        size: 10,
        color: '#94a3b8',
        face: 'Inter'
      },
      arrows: {
        to: {
          enabled: true,
          scaleFactor: 0.5
        }
      },
      smooth: {
        type: 'curvedCW',
        roundness: 0.2
      },
      width: 2
    }));

    const data = {
      nodes: nodes,
      edges: edges
    };

    const options = {
      nodes: {
        shape: 'dot',
        size: 20,
        font: {
          size: 14,
          face: 'Inter',
          color: '#ffffff',
          strokeWidth: 2,
          strokeColor: '#000000'
        },
        borderWidth: 2,
        shadow: true
      },
      edges: {
        width: 2,
        shadow: true,
        smooth: {
          type: 'curvedCW',
          roundness: 0.2
        },
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.5
          }
        }
      },
      physics: {
        enabled: true,
        stabilization: {
          iterations: 100
        },
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 100,
          springConstant: 0.08,
          damping: 0.4
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true,
        dragView: true,
        navigationButtons: true
      },
      layout: {
        improvedLayout: true,
        hierarchical: {
          enabled: false
        }
      }
    };

    const network = new Network(containerRef.current, data, options);
    networkRef.current = network;

    // Click handler
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const item = itemsData.find(i => i.id === nodeId);
        if (item) {
          setSelectedNode(item);
        }
      }
    });

    // Double click to open item
    network.on('doubleClick', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        window.location.href = `/knowledge/item/${nodeId}`;
      }
    });
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  const getTypeIconForDisplay = (type) => {
    const icons = {
      NOTE: '📝',
      BOOKMARK: '🔗',
      CODE: '💻',
      IDEA: '💡',
      RESOURCE: '📚'
    };
    return icons[type] || '📄';
  };

  if (loading) {
    return (
      <div className="knowledge-page">
        <div className="knowledge-header">
          <div className="knowledge-header-content">
            <div className="knowledge-logo">NEXUS</div>
            <div className="knowledge-header-actions">
              <Link to="/ai-builder" className="nav-link">🤖 AI Builder</Link>
              <Link to="/knowledge" className="nav-link">📚 Dashboard</Link>
              <span className="nav-link active">🕸️ Graph</span>
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
        </div>
        <div className="loading-state" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
          Building your knowledge graph...
        </div>
      </div>
    );
  }

  return (
    <div className="knowledge-page page-transition">
      {/* Header */}
      <div className="knowledge-header">
        <div className="knowledge-header-content">
          <div className="knowledge-logo">NEXUS</div>
          <div className="knowledge-header-actions">
            <Link to="/ai-builder" className="nav-link">🤖 AI Builder</Link>
            <Link to="/knowledge" className="nav-link">📚 Dashboard</Link>
            <span className="nav-link active">🕸️ Graph</span>
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
      </div>

      {/* Graph Controls */}
      <div className="graph-controls">
        <div className="graph-stats">
          <span>🧠 {items.length} Items</span>
          <span>🔗 {connections.length} Connections</span>
          <span>🏷️ {new Set(items.flatMap(i => i.tags?.map(t => t.id) || [])).size} Tags</span>
        </div>
        <div className="graph-actions">
          <button onClick={handleRefresh} className="primary-button small">🔄 Refresh</button>
          <button onClick={() => networkRef.current?.fit()} className="primary-button small">🔍 Fit</button>
          <button 
            onClick={() => {
              if (networkRef.current) {
                const physics = networkRef.current.getOptions().physics;
                networkRef.current.setOptions({ physics: { enabled: !physics?.enabled } });
              }
            }} 
            className="primary-button small"
          >
            ⚡ Physics
          </button>
        </div>
      </div>

      {/* Graph Container */}
      <div className="graph-container-wrapper">
        <div className="graph-container" ref={containerRef} />
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="graph-node-info">
          <div className="node-info-header">
            <span>{getTypeIconForDisplay(selectedNode.type)}</span>
            <h3>{selectedNode.title}</h3>
            <button onClick={() => setSelectedNode(null)} className="close-info">✕</button>
          </div>
          <p className="node-info-content">
            {selectedNode.content?.substring(0, 200)}
            {selectedNode.content?.length > 200 && '...'}
          </p>
          <div className="node-info-actions">
            <Link to={`/knowledge/item/${selectedNode.id}`} className="primary-button small">
              View Details
            </Link>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="graph-legend">
        <span className="legend-title">Legend:</span>
        <span className="legend-item" style={{ color: '#6366f1' }}>● Notes</span>
        <span className="legend-item" style={{ color: '#f59e0b' }}>● Bookmarks</span>
        <span className="legend-item" style={{ color: '#10b981' }}>● Code</span>
        <span className="legend-item" style={{ color: '#ec4899' }}>● Ideas</span>
        <span className="legend-item" style={{ color: '#3b82f6' }}>● Resources</span>
      </div>
    </div>
  );
}