import React from 'react';

function ProblemInput({ 
  problem, 
  setProblem, 
  onAnalyze, 
  isLoading,
  loadingState,
  getLoadingMessage 
}) {
  return (
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
            onAnalyze();
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
            onClick={onAnalyze}
            disabled={isLoading}
          >
            {isLoading ? (
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
  );
}

export default ProblemInput;