import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, BookOpen, History, Sun, Moon, X,
  ArrowRight, Wand2, AlertTriangle, Star,
} from 'lucide-react';
import ProblemAnalysis from '../components/ProblemAnalysis';
import SolutionList from '../components/SolutionList';
import Blueprint from '../components/Blueprint';
import HeaderShortcutsButton from '../components/HeaderShortcutsButton';
import {
  analyzeProblem,
  generateSolutions,
  generateBlueprint,
} from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
  copyToClipboard,
  formatBlueprintForCopy,
  showToast,
  decodeSharedDataFromURL,
} from '../services/utils';
import { saveToHistory, getHistory, deleteHistoryEntry } from '../services/history';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const LOADING_STATES = {
  IDLE: 'idle',
  ANALYZING: 'analyzing',
  GENERATING_SOLUTIONS: 'generating_solutions',
  GENERATING_BLUEPRINT: 'generating_blueprint',
};

function AIBuilder() {
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

  const isLoading = loadingState !== LOADING_STATES.IDLE;

  // Load history + handle shared data on mount
  useEffect(() => {
    const savedHistory = getHistory();
    setHistory(savedHistory);

    const shared = decodeSharedDataFromURL();
    if (shared) {
      if (shared.problem) setProblem(shared.problem);
      if (shared.analysis) setAnalysis(shared.analysis);
      if (Array.isArray(shared.solutions)) setSolutions(shared.solutions);
      if (shared.selectedSolution) setSelectedSolution(shared.selectedSolution);
      if (shared.blueprint) setBlueprint(shared.blueprint);
      showToast('Loaded shared blueprint!', 'success');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Esc closes history sidebar (shortcuts modal handles its own Esc)
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && showHistory) {
        setShowHistory(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showHistory]);

  const getLoadingMessage = () => {
    switch (loadingState) {
      case LOADING_STATES.ANALYZING: return 'Analyzing your problem...';
      case LOADING_STATES.GENERATING_SOLUTIONS: return 'Generating solutions...';
      case LOADING_STATES.GENERATING_BLUEPRINT: return 'Building blueprint...';
      default: return 'Processing...';
    }
  };

  const handleAnalyze = async () => {
    if (!problem.trim()) {
      setError('Please describe a problem first.');
      showToast('Please describe a problem first.', 'error');
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
      const result = await analyzeProblem(problem);
      setAnalysis(result.analysis);
      showToast('Problem analyzed successfully!', 'success');
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Nexus could not analyze the problem right now. Please try again.');
      showToast('Failed to analyze problem', 'error');
    } finally {
      setLoadingState(LOADING_STATES.IDLE);
    }
  };

  const handleGenerateSolutions = async () => {
    if (!analysis) {
      setError('Please analyze the problem first.');
      showToast('Please analyze the problem first.', 'error');
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
      showToast('Solutions generated successfully!', 'success');
    } catch (err) {
      console.error('Solutions error:', err);
      setError('Nexus could not generate solutions right now. Please try again.');
      showToast('Failed to generate solutions', 'error');
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

      const entry = saveToHistory(
        problem,
        analysis,
        solutions,
        solution,
        result.blueprint
      );
      if (entry) {
        setBlueprintId(entry.id);
        setHistory((prev) => [entry, ...prev]);
      }

      showToast('Blueprint generated successfully!', 'success');
    } catch (err) {
      console.error('Blueprint error:', err);
      setError('Nexus could not generate the MVP blueprint right now. Please try again.');
      showToast('Failed to generate blueprint', 'error');
    } finally {
      setLoadingState(LOADING_STATES.IDLE);
    }
  };

  const handleCopyBlueprint = async () => {
    if (!blueprint) {
      showToast('No blueprint to copy', 'error');
      return;
    }
    const text = formatBlueprintForCopy(blueprint);
    const success = await copyToClipboard(text);
    if (success) {
      showToast('Blueprint copied to clipboard!', 'success');
    } else {
      showToast('Failed to copy. Please try again.', 'error');
    }
  };

  const loadHistoryEntry = (entry) => {
    setProblem(entry.problem);
    setAnalysis(entry.analysis);
    setSolutions(entry.solutions || []);
    setSelectedSolution(entry.selectedSolution);
    setBlueprint(entry.blueprint);
    setBlueprintId(entry.id);
    setShowHistory(false);
    showToast('Loaded from history!', 'success');
  };

  const deleteEntry = (id) => {
    deleteHistoryEntry(id);
    setHistory((prev) => prev.filter((e) => e.id !== id));
    if (blueprintId === id) {
      setBlueprint(null);
      setBlueprintId(null);
    }
    showToast('Entry deleted', 'info');
  };

  const refreshHistory = () => {
    const savedHistory = getHistory();
    setHistory(savedHistory);
  };

  useKeyboardShortcuts({
    onAnalyze: handleAnalyze,
    onGenerateSolutions: handleGenerateSolutions,
    onGenerateBlueprint: () => {
      if (selectedSolution && !isLoading) handleSelectSolution(selectedSolution);
    },
    onCopy: handleCopyBlueprint,
    onToggleTheme: toggleDarkMode,
    onToggleHistory: () => setShowHistory(!showHistory),
  });

  return (
    <main className="app ai-builder-page">
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">NEXUS</div>
            <span className="tagline">AI Product Builder</span>
          </div>
          <div className="header-actions">
            <Link
              to="/knowledge"
              className="knowledge-cta-button"
              title="Open your Knowledge Base"
            >
              <span className="cta-icon"><Brain size={22} /></span>
              <span className="cta-content">
                <span className="cta-title">Knowledge</span>
                <span className="cta-subtitle">Your second brain</span>
              </span>
              <span className="cta-arrow"><ArrowRight size={16} /></span>
            </Link>
            <button
              className="header-button"
              onClick={() => setShowHistory(!showHistory)}
              title="View history (Ctrl+H)"
            >
              <History size={18} />
            </button>
            <HeaderShortcutsButton />
            <div className="header-badge">FROM PROBLEM TO PRODUCT</div>
            <button
              className="theme-toggle"
              onClick={toggleDarkMode}
              title="Toggle theme (Ctrl+D)"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow">FROM PROBLEM TO PRODUCT</div>
        <h1>
          Turn problems into
          <span> ideas, solutions,</span>
          <br />
          and actionable MVPs.
        </h1>
        <p className="hero-description">
          Describe a problem. Nexus analyzes it, explores possible solutions,
          and creates a practical MVP blueprint you can actually build.
        </p>
      </section>

      <div className="nexus-workspace">
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
            onChange={(e) => setProblem(e.target.value)}
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
            <span className="character-count">{problem.length} characters</span>
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
                  <>
                    <Wand2 size={16} />
                    Analyze Problem
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <AlertTriangle size={20} className="error-icon" />
            <span>{error}</span>
            <button className="error-close" onClick={() => setError('')}>
              <X size={20} />
            </button>
          </div>
        )}

        {analysis && (
          <ProblemAnalysis
            analysis={analysis}
            onGenerateSolutions={handleGenerateSolutions}
            loading={
              isLoading &&
              loadingState === LOADING_STATES.GENERATING_SOLUTIONS
            }
          />
        )}

        {solutions.length > 0 && (
          <SolutionList
            solutions={solutions}
            onSelect={handleSelectSolution}
          />
        )}

        {selectedSolution && (
          <div className="selected-solution">
            <div>
              <span className="card-label">SELECTED SOLUTION</span>
              <h3>{selectedSolution.name}</h3>
              <p>
                {isLoading &&
                loadingState === LOADING_STATES.GENERATING_BLUEPRINT
                  ? 'Building your MVP blueprint...'
                  : 'Blueprint ready!'}
              </p>
            </div>
            <div className="selected-solution-actions">
              <span className="difficulty-badge">
                {selectedSolution.difficulty}
              </span>
              {isLoading &&
                loadingState === LOADING_STATES.GENERATING_BLUEPRINT && (
                  <div className="loading-indicator">
                    <span className="spinner-small"></span>
                    Generating...
                  </div>
                )}
            </div>
          </div>
        )}

        {blueprint && (
          <Blueprint
            blueprint={blueprint}
            loading={
              isLoading &&
              loadingState === LOADING_STATES.GENERATING_BLUEPRINT
            }
            blueprintId={blueprintId}
            onRefresh={refreshHistory}
            sharePayload={{
              problem,
              analysis,
              solutions,
              selectedSolution,
              blueprint,
            }}
          />
        )}
      </div>

      {showHistory && (
        <div
          className="history-overlay"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="history-sidebar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="history-header">
              <h3>
                <History size={20} /> History
              </h3>
              <div>
                {history.length > 0 && (
                  <button
                    className="history-clear"
                    onClick={() => {
                      if (window.confirm('Clear all history?')) {
                        localStorage.removeItem('nexus_problem_history');
                        setHistory([]);
                        showToast('History cleared', 'info');
                      }
                    }}
                  >
                    Clear All
                  </button>
                )}
                <button
                  className="history-close"
                  onClick={() => setShowHistory(false)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="history-list">
              {history.length === 0 ? (
                <p className="empty-state">
                  No history yet. Generate a blueprint to save it here!
                </p>
              ) : (
                history.map((entry) => (
                  <div
                    key={entry.id}
                    className={`history-item ${
                      entry.favorite ? 'favorite' : ''
                    }`}
                  >
                    <div className="history-item-content">
                      <div className="history-item-top">
                        <strong>{entry.problem?.slice(0, 60)}...</strong>
                        {entry.favorite && (
                          <Star size={14} fill="#f59e0b" color="#f59e0b" />
                        )}
                      </div>
                      <span className="history-date">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="history-item-actions">
                      <button
                        onClick={() => loadHistoryEntry(entry)}
                        title="Load"
                      >
                        <BookOpen size={14} />
                      </button>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        title="Delete"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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

export default AIBuilder;