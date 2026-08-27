function ProblemAnalysis({ analysis, onGenerateSolutions, loading }) {
  return (
    <section className="analysis-section">

      <div className="section-heading">
        <div>
          <span className="step-label">02</span>
          <h2>Problem Analysis</h2>
          <p>
            Nexus broke your problem down into its
            most important parts.
          </p>
        </div>
      </div>

      <div className="analysis-grid">

        <article className="analysis-card">
          <span className="card-label">TARGET USERS</span>

          <h3>{analysis.targetUsers}</h3>
        </article>

        <article className="analysis-card">
          <span className="card-label">CORE PROBLEM</span>

          <p>{analysis.coreProblem}</p>
        </article>

      </div>

      <article className="analysis-card wide-card">
        <span className="card-label">WHY IT MATTERS</span>

        <p>{analysis.whyItMatters}</p>
      </article>

      <div className="pain-points">

        <div className="pain-points-header">
          <div>
            <span className="card-label">PAIN POINTS</span>
            <h3>What's going wrong?</h3>
          </div>

          <span className="pain-count">
            {analysis.painPoints.length} identified
          </span>
        </div>

        <div className="pain-list">

          {analysis.painPoints.map((painPoint, index) => (
            <div className="pain-item" key={index}>

              <span className="pain-number">
                {String(index + 1).padStart(2, '0')}
              </span>

              <p>{painPoint}</p>

            </div>
          ))}

        </div>

      </div>

      <div className="analysis-action">

        <div>
          <strong>Ready to explore solutions?</strong>

          <p>
            Nexus will generate multiple possible
            approaches to this problem.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={onGenerateSolutions}
          disabled={loading}
        >
          {loading
            ? 'Generating...'
            : 'Generate Solutions →'}
        </button>

      </div>

    </section>
  )
}

export default ProblemAnalysis