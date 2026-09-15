import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bot, BookOpen, Network as NetworkIcon, BarChart3,
  Tags as TagsIcon, Sun, Moon, RefreshCw, Maximize, Zap, X,
} from 'lucide-react';
import { Network } from 'vis-network/standalone';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useKnowledgeShortcuts } from '../hooks/useKnowledgeShortcuts';
import useMinimumLoader from '../hooks/useMinimumLoader';
import HeaderShortcutsButton from '../components/HeaderShortcutsButton';
import NexusLoader from '../components/NexusLoader';
import '../components/NexusLoader.css';

export default function KnowledgeGraph() {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [physicsEnabled, setPhysicsEnabled] = useState(true);
  const networkRef = useRef(null);
  const containerRef = useRef(null);

  const showLoader = useMinimumLoader(loading, 1400);

  useEffect(() => {
    fetchData();
  }, []);

  useKnowledgeShortcuts({
    onCreate: () => navigate('/knowledge/create'),
    onSearch: () => navigate('/knowledge'),
    onDashboard: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    onGraph: () => {},
    onToggleTheme: toggleDarkMode,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const itemsRes = await api.getItems();
      setItems(itemsRes.data);

      const allConnections = [];
      itemsRes.data.forEach((item) => {
        if (item.connectionsFrom?.length > 0) {
          item.connectionsFrom.forEach((conn) => allConnections.push(conn));
        }
        if (item.connectionsTo?.length > 0) {
          item.connectionsTo.forEach((conn) => allConnections.push(conn));
        }
      });

      setConnections(allConnections);
      setTimeout(() => buildGraph(itemsRes.data, allConnections), 200);
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
      RESOURCE: '#3b82f6',
    };
    return colors[type] || '#6366f1';
  };

  const buildGraph = (itemsData, connectionsData) => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    if (connectionsData.length === 0) {
      containerRef.current.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:1.2rem;flex-direction:column;gap:12px;">
          <span style="font-size:3rem;">🕸️</span>
          <span>No connections yet</span>
          <span style="font-size:0.9rem;">Connect items to see them in the graph</span>
        </div>
      `;
      return;
    }

    const connectedItemIds = new Set();
    connectionsData.forEach((conn) => {
      connectedItemIds.add(conn.fromItemId);
      connectedItemIds.add(conn.toItemId);
    });

    const connectedItems = itemsData.filter((item) =>
      connectedItemIds.has(item.id)
    );
    if (connectedItems.length === 0) return;

    const nodesMap = new Map();
    connectedItems.forEach((item) => {
      nodesMap.set(item.id, {
        id: item.id,
        label:
          item.title.length > 25
            ? item.title.substring(0, 25) + '...'
            : item.title,
        title: `${item.title}\n${(item.content || '').substring(0, 100)}...`,
        color: {
          background: getTypeColor(item.type),
          border: getTypeColor(item.type),
          highlight: {
            background: getTypeColor(item.type),
            border: '#ffffff',
          },
        },
        font: {
          color: '#ffffff',
          size: 14,
          face: 'Inter',
          strokeWidth: 2,
          strokeColor: 'rgba(0,0,0,0.4)',
        },
        shape: 'dot',
        size: 25,
        borderWidth: 2,
        shadow: true,
      });
    });

    const edgesMap = new Map();
    connectionsData.forEach((conn) => {
      if (
        connectedItemIds.has(conn.fromItemId) &&
        connectedItemIds.has(conn.toItemId) &&
        !edgesMap.has(conn.id)
      ) {
        edgesMap.set(conn.id, {
          id: conn.id,
          from: conn.fromItemId,
          to: conn.toItemId,
          label: conn.type || 'RELATED',
          color: {
            color: 'rgba(148, 163, 184, 0.4)',
            highlight: '#6366f1',
            hover: '#6366f1',
          },
          font: {
            size: 9,
            color: '#94a3b8',
            face: 'Inter',
            strokeWidth: 0,
          },
          arrows: {
            to: { enabled: true, scaleFactor: 0.4 },
          },
          smooth: {
            type: 'continuous',
            roundness: 0.5,
          },
          width: 1.5,
        });
      }
    });

    const nodes = Array.from(nodesMap.values());
    const edges = Array.from(edgesMap.values());
    if (nodes.length === 0 || edges.length === 0) return;

    const options = {
      nodes: {
        shape: 'dot',
        size: 25,
        font: {
          size: 14,
          face: 'Inter',
          color: '#ffffff',
          strokeWidth: 2,
          strokeColor: 'rgba(0,0,0,0.4)',
        },
        borderWidth: 2,
        shadow: true,
      },
      edges: {
        width: 1.5,
        shadow: false,
        smooth: { type: 'continuous', roundness: 0.5 },
        arrows: { to: { enabled: true, scaleFactor: 0.4 } },
      },
      physics: {
        enabled: true,
        stabilization: {
          enabled: true,
          iterations: 400,
          updateInterval: 25,
          fit: true,
        },
        barnesHut: {
          theta: 0.5,
          gravitationalConstant: -8000,
          centralGravity: 0.3,
          springLength: 95,
          springConstant: 0.04,
          damping: 0.09,
          avoidOverlap: 0.5,
        },
        maxVelocity: 50,
        minVelocity: 0.1,
        solver: 'barnesHut',
        timestep: 0.5,
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true,
        dragView: true,
        navigationButtons: false,
        multiselect: false,
      },
      layout: {
        improvedLayout: true,
        hierarchical: { enabled: false },
      },
    };

    const network = new Network(containerRef.current, { nodes, edges }, options);
    networkRef.current = network;

    network.once('stabilizationIterationsDone', () => {
      network.setOptions({ physics: { enabled: false } });
      setPhysicsEnabled(false);
      try {
        network.fit();
      } catch (e) {}
    });

    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const item = connectedItems.find((i) => i.id === params.nodes[0]);
        if (item) setSelectedNode(item);
      }
    });

    network.on('doubleClick', (params) => {
      if (params.nodes.length > 0) {
        window.location.href = `/knowledge/item/${params.nodes[0]}`;
      }
    });
  };

  const handleRefresh = () => fetchData();

  const togglePhysics = () => {
    if (networkRef.current) {
      const newState = !physicsEnabled;
      setPhysicsEnabled(newState);
      networkRef.current.setOptions({
        physics: { enabled: newState },
      });
    }
  };

  if (showLoader) {
    return <NexusLoader isVisible={true} duration={1400} fullscreen={false} />;
  }

  return (
    <div className="knowledge-page page-transition graph-page">
      <div className="knowledge-header">
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
              <span className="nav-link active">
                <NetworkIcon size={16} /> Graph
              </span>
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
      </div>

      <div className="graph-controls">
        <div className="graph-stats">
          <span>🧠 {items.length} Items</span>
          <span>🔗 {connections.length} Connections</span>
          <span>
            🏷️{' '}
            {new Set(items.flatMap((i) => i.tags?.map((t) => t.id) || [])).size}{' '}
            Tags
          </span>
        </div>
        <div className="graph-actions">
          <button onClick={handleRefresh} className="primary-button small">
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => {
              if (networkRef.current) {
                try {
                  networkRef.current.fit();
                } catch (e) {}
              }
            }}
            className="primary-button small"
          >
            <Maximize size={14} /> Fit
          </button>
          <button
            onClick={togglePhysics}
            className={`primary-button small ${physicsEnabled ? 'active' : ''}`}
          >
            <Zap size={14} /> Physics {physicsEnabled ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      <div className="graph-full-wrapper">
        <div className="graph-container" id="graph-container" ref={containerRef} />
      </div>

      {selectedNode && (
        <div className="graph-node-info">
          <div className="node-info-header">
            <h3>{selectedNode.title}</h3>
            <button onClick={() => setSelectedNode(null)} className="close-info">
              <X size={18} />
            </button>
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
