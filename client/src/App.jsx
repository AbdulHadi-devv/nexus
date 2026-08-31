import { useState, useEffect } from 'react';
import ProblemAnalysis from './components/ProblemAnalysis';
import SolutionList from './components/SolutionList';
import Blueprint from './components/Blueprint';
import {
  analyzeProblem,
  generateSolutions,
  generateBlueprint,
} from './services/api';
import './App.css';
import { useTheme } from './context/ThemeContext';
import { 
  copyToClipboard, 
  formatBlueprintForCopy, 
  showToast,
  decodeBlueprintFromURL
} from './services/utils';
import { saveToHistory, getHistory, deleteHistoryEntry } from './services/history';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Loading states
const LOADING_STATES = {
  IDLE: 'idle',
  ANALYZING: 'analyzing',
  GENERATING_SOLUTIONS: 'generating_solutions',
  GENERATING_BLUEPRINT: 'generating_blueprint'
};

function App() {
  const { darkMode, toggleDarkMode } = useTheme();

  const [problem, setProblem] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [solutions, setSolutions] = useState([]);
  const [selectedSolution, setSelectedSolution] = useState(null);
  const [blueprint, setBlueprint] = useState(null);
  const [blueprintId, setBlueprintId] = useState(null);
  const [error, setError] = useState('');
  const [loadingState, setLoadingState] = useState(LOADING_STATES.IDLE);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const isLoading = loadingState !== LOADING_STATES.IDLE;

  // Load history on mount and check for shared blueprint
  useEffect(() => {
    const savedHistory = getHistory();
    setHistory(savedHistory);

    // Check for shared blueprint in URL
    const sharedBlueprint = decodeBlueprintFromURL();
    if (sharedBlueprint) {
      setBlueprint(sharedBlueprint);
      showToast('📦 Loaded shared blueprint!', 'success');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const getLoadingMessage = () => {
    switch (loadingState) {
      case LOADING_STATES.ANALYZING:
        return 'Analyzing your problem...';
      case LOADING_STATES.GENERATING_SOLUTIONS:
        return 'Generating possible solutions...';
      case LOADING_STATES.GENERATING_BLUEPRINT:
        return 'Building your MVP blueprint...';
      default:
        return 'Processing...';
    }
  };

  const handleAnalyze = async () => {
    // Get the current problem value directly from state
    const currentProblem = problem;
    
    if (!currentProblem.trim()) {
      setError('Please describe a problem first.');
      showToast('❌ Please describe a problem first.', 'error');
      return;
    }

    setError('');
    setAnalysis(null);
    setSolutions([]);
    setSelectedSolution(null);
    setBlueprint(null);
    setBlueprintId(null);
    setLoadingState(LOADING_STATES.ANALYZING);

    try {
      const result = await analyzeProblem(currentProblem);
      setAnalysis(result.analysis);
      console.log('Analysis received:', result.analysis);
      showToast('✅ Problem analyzed successfully!', 'success');
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Nexus could not analyze the problem right now. Please try again.');
      showToast('❌ Failed to analyze problem', 'error');
    } finally {
      setLoadingState(LOADING_STATES.IDLE);
    }
  };

  const handleGenerateSolutions = async () => {
    if (!analysis) {
      setError('Please analyze the problem first.');
      showToast('❌ Please analyze the problem first.', 'error');
      return;
    }

    setError('');
    setSolutions([]);
    setSelectedSolution(null);
    setBlueprint(null);
    setBlueprintId(null);
    setLoadingState(LOADING_STATES.GENERATING_SOLUTIONS);

    try {
      const result = await generateSolutions(problem, analysis);
      setSolutions(result.solutions);
      console.log('Solutions received:', result.solutions);
      showToast('💡 Solutions generated successfully!', 'success');
    } catch (err) {
      console.error('Solutions error:', err);
      setError('Nexus could not generate solutions right now. Please try again.');
      showToast('❌ Failed to generate solutions', 'error');
    } finally {
      setLoadingState(LOADING_STATES.IDLE);
    }
  };

  const handleSelectSolution = async (solution) => {
    setSelectedSolution(solution);
    setBlueprint(null);
    setBlueprintId(null);
    setError('');
    setLoadingState(LOADING_STATES.GENERATING_BLUEPRINT);

    try {
      const result = await generateBlueprint(problem, analysis, solution);
      setBlueprint(result.blueprint);
      console.log('Blueprint received:', result.blueprint);
      
      // Save to history
      const entry = saveToHistory(
        problem,
        analysis,
        solutions,
        solution,
        result.blueprint
      );
      if (entry) {
        setBlueprintId(entry.id);
        setHistory(prev => [entry, ...prev]);
        showToast('📚 Saved to history!', 'success');
      }
      
      showToast('🏗️ Blueprint generated successfully!', 'success');
    } catch (err) {
      console.error('Blueprint error:', err);
      setError('Nexus could not generate the MVP blueprint right now. Please try again.');
      showToast('❌ Failed to generate blueprint', 'error');
    } finally {
      setLoadingState(LOADING_STATES.IDLE);
    }
  };

  const handleCopyBlueprint = async () => {
    if (!blueprint) {
      showToast('❌ No blueprint to copy', 'error');
      return;
    }
    const text = formatBlueprintForCopy(blueprint);
    const success = await copyToClipboard(text);
    if (success) {
      showToast('✅ Blueprint copied to clipboard!', 'success');
    } else {
      showToast('❌ Failed to copy. Please try again.', 'error');
    }
  };

  const handleExportBlueprint = () => {
    if (!blueprint) {
      showToast('❌ No blueprint to export', 'error');
      return;
    }
    showToast('📄 Opening export options...', 'info');
  };

  const loadHistoryEntry = (entry) => {
    setProblem(entry.problem);
    setAnalysis(entry.analysis);
    setSolutions(entry.solutions || []);
    setSelectedSolution(entry.selectedSolution);
    setBlueprint(entry.blueprint);
    setBlueprintId(entry.id);
    setShowHistory(false);
    showToast('📂 Loaded from history!', 'success');
  };

  const deleteEntry = (id) => {
    deleteHistoryEntry(id);
    setHistory(prev => prev.filter(e => e.id !== id));
    if (blueprintId === id) {
      setBlueprint(null);
      setBlueprintId(null);
    }
    showToast('🗑️ Entry deleted', 'info');
  };

  const refreshHistory = () => {
    const savedHistory = getHistory();
    setHistory(savedHistory);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onAnalyze: handleAnalyze,
    onGenerateSolutions: handleGenerateSolutions,
    onGenerateBlueprint: () => {
      if (selectedSolution && !isLoading) {
        handleSelectSolution(selectedSolution);
      }
    },
    onCopy: handleCopyBlueprint,
    onExport: handleExportBlueprint,
    onToggleTheme: toggleDarkMode,
    onToggleHistory: () => setShowHistory(!showHistory),
    onToggleShortcuts: () => setShowShortcuts(!showShortcuts)
  });

  return (
    <main className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">NEXUS</div>
            <span className="tagline">AI Product Builder</span>
          </div>
          <div className="header-actions">
            <button 
              className="header-button"
              onClick={() => setShowHistory(!showHistory)}
              title="View history (Ctrl+H)"
            >
              📚
            </button>
            <button 
              className="header-button"
              onClick={() => setShowShortcuts(!showShortcuts)}
              title="Keyboard shortcuts (Ctrl+Shift+/)"
            >
              ⌨️
            </button>
            <div className="header-badge">FROM PROBLEM TO PRODUCT</div>
            <button
              className="theme-toggle"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              title="Toggle theme (Ctrl+D)"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="eyebrow">FROM PROBLEM TO PRODUCT</div>
        <h1>
          Turn problems into
          <span> ideas, solutions,</span>
          <br />
          and actionable MVPs.
        </h1>
        <p className="hero-description">
          Describe a problem. Nexus analyzes it, explores
          possible solutions, and creates a practical MVP
          blueprint you can actually build.
        </p>
      </section>

      {/* Main Workspace */}
      <div className="nexus-workspace">
        {/* Problem Input */}
        <div className="problem-card">
          <div className="problem-card-header">
            <div>
              <span className="step-label">01</span>
              <h2>Describe your problem</h2>
              <p>What challenge are you trying to solve?</p>
            </div>
            <div className="ai-indicator">
              <span className="pulse-dot"></span>
              AI POWERED
            </div>
          </div>

          <textarea
            value={problem}
            onChange={(event) => setProblem(event.target.value)}
            placeholder="Example: Students struggle to find good study resources for difficult topics..."
            rows="7"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                handleAnalyze();
              }
            }}
          />

          <div className="problem-card-footer">
            <span className="character-count">
              {problem.length} characters
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="shortcut-hint">Ctrl+Enter</span>
              <button
                className={`primary-button ${isLoading ? 'loading' : ''}`}
                onClick={handleAnalyze}
                disabled={isLoading}
              >
                {isLoading && loadingState === LOADING_STATES.ANALYZING ? (
                  <>
                    <span className="spinner"></span>
                    {getLoadingMessage()}
                  </>
                ) : (
                  'Analyze Problem →'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button className="error-close" onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Analysis */}
        {analysis && (
          <ProblemAnalysis
            analysis={analysis}
            onGenerateSolutions={handleGenerateSolutions}
            loading={isLoading && loadingState === LOADING_STATES.GENERATING_SOLUTIONS}
          />
        )}

        {/* Solutions */}
        {solutions.length > 0 && (
          <SolutionList
            solutions={solutions}
            onSelect={handleSelectSolution}
          />
        )}

        {/* Selected Solution */}
        {selectedSolution && (
          <div className="selected-solution">
            <div>
              <span className="card-label">SELECTED SOLUTION</span>
              <h3>{selectedSolution.name}</h3>
              <p>
                {isLoading && loadingState === LOADING_STATES.GENERATING_BLUEPRINT ? (
                  'Building your MVP blueprint...'
                ) : (
                  'Blueprint ready!'
                )}
              </p>
            </div>
            <div className="selected-solution-actions">
              <span className="difficulty-badge">
                {selectedSolution.difficulty}
              </span>
              {isLoading && loadingState === LOADING_STATES.GENERATING_BLUEPRINT && (
                <div className="loading-indicator">
                  <span className="spinner-small"></span>
                  Generating...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Blueprint */}
        {blueprint && (
          <Blueprint
            blueprint={blueprint}
            loading={isLoading && loadingState === LOADING_STATES.GENERATING_BLUEPRINT}
            blueprintId={blueprintId}
            onRefresh={refreshHistory}
          />
        )}
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <div className="history-overlay" onClick={() => setShowHistory(false)}>
          <div className="history-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="history-header">
              <h3>📚 History</h3>
              <div>
                {history.length > 0 && (
                  <button 
                    className="history-clear"
                    onClick={() => {
                      if (window.confirm('Clear all history?')) {
                        localStorage.removeItem('nexus_problem_history');
                        setHistory([]);
                        showToast('🗑️ History cleared', 'info');
                      }
                    }}
                  >
                    Clear All
                  </button>
                )}
                <button className="history-close" onClick={() => setShowHistory(false)}>✕</button>
              </div>
            </div>
            <div className="history-list">
              {history.length === 0 ? (
                <p className="empty-state">No history yet. Generate a blueprint to save it here!</p>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className={`history-item ${entry.favorite ? 'favorite' : ''}`}>
                    <div className="history-item-content">
                      <div className="history-item-top">
                        <strong>{entry.problem?.slice(0, 60)}...</strong>
                        {entry.favorite && <span className="favorite-star">⭐</span>}
                      </div>
                      <span className="history-date">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="history-item-actions">
                      <button onClick={() => loadHistoryEntry(entry)} title="Load this blueprint">📂</button>
                      <button onClick={() => deleteEntry(entry.id)} title="Delete">🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts Help */}
      {showShortcuts && (
        <div className="shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-header">
              <h3>⌨️ Keyboard Shortcuts</h3>
              <button className="shortcuts-close" onClick={() => setShowShortcuts(false)}>✕</button>
            </div>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span className="shortcut-key">Ctrl + 1</span>
                <span className="shortcut-action">Analyze Problem</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Ctrl + 2</span>
                <span className="shortcut-action">Generate Solutions</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Ctrl + 3</span>
                <span className="shortcut-action">Generate Blueprint</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Ctrl + C</span>
                <span className="shortcut-action">Copy Blueprint</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Ctrl + H</span>
                <span className="shortcut-action">Toggle History</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Ctrl + D</span>
                <span className="shortcut-action">Toggle Dark/Light Mode</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Ctrl + Enter</span>
                <span className="shortcut-action">Analyze (in textarea)</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Ctrl + Shift + /</span>
                <span className="shortcut-action">Toggle Shortcuts</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Esc</span>
                <span className="shortcut-action">Close Modals</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <strong>NEXUS</strong>
          <div className="footer-divider"></div>
          <span>Turn ideas into action.</span>
          <div className="footer-shortcuts">
            <span>Ctrl+1 Analyze</span>
            <span>Ctrl+2 Solutions</span>
            <span>Ctrl+3 Blueprint</span>
            <span>Ctrl+D Theme</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default App;