import React from 'react';

function ProblemAnalysis({ analysis, onGenerateSolutions, loading }) {
  if (!analysis) return null;

  // Helper to clean text (remove backticks)
  const cleanText = (text) => {
    if (!text) return 'Not available';
    return String(text)
      .replace(/```/g, '')
      .replace(/`/g, '')
      .trim() || 'Not available';
  };

  const painPoints = Array.isArray(analysis.painPoints) 
    ? analysis.painPoints 
    : [];

  return (
    <section className="analysis-section">
      <div className="section-heading">
        <span className="step-label">02</span>
        <h2>Problem Analysis</h2>
        <p>
          Nexus broke your problem down into its most important parts.
        </p>
      </div>

      <div className="analysis-grid">
        {/* Target Users */}
        <div className="analysis-card">
          <div className="analysis-card-header">
            <span className="analysis-icon">👥</span>
            <span className="card-label">TARGET USERS</span>
          </div>
          <p className="analysis-content">
            {cleanText(analysis.targetUsers)}
          </p>
        </div>

        {/* Core Problem */}
        <div className="analysis-card">
          <div className="analysis-card-header">
            <span className="analysis-icon">🎯</span>
            <span className="card-label">CORE PROBLEM</span>
          </div>
          <p className="analysis-content">
            {cleanText(analysis.coreProblem)}
          </p>
        </div>

        {/* Why It Matters */}
        <div className="analysis-card">
          <div className="analysis-card-header">
            <span className="analysis-icon">💡</span>
            <span className="card-label">WHY IT MATTERS</span>
          </div>
          <p className="analysis-content">
            {cleanText(analysis.whyItMatters)}
          </p>
        </div>

        {/* Pain Points */}
        <div className="analysis-card pain-points-card">
          <div className="analysis-card-header">
            <span className="analysis-icon">⚠️</span>
            <span className="card-label">PAIN POINTS</span>
          </div>
          <div className="pain-points-list">
            {painPoints.length > 0 ? (
              painPoints.map((point, index) => (
                <div key={index} className="pain-point-item">
                  <span className="pain-point-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p>{cleanText(point)}</p>
                </div>
              ))
            ) : (
              <p className="empty-state">No specific pain points identified.</p>
            )}
          </div>
        </div>
      </div>

      {/* Generate Solutions Button */}
      <div className="analysis-actions">
        <div className="analysis-ready">
          <span className="ready-indicator">✅</span>
          <div>
            <strong>Ready to explore solutions?</strong>
            <p>Nexus will generate multiple possible approaches to this problem.</p>
          </div>
        </div>
        <button
          className={`primary-button ${loading ? 'loading' : ''}`}
          onClick={onGenerateSolutions}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Generating Solutions...
            </>
          ) : (
            'Generate Solutions →'
          )}
        </button>
      </div>
    </section>
  );
}

export default ProblemAnalysis;