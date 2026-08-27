import SolutionCard from './SolutionCard'

function SolutionList({ solutions, onSelect, loading }) {
  return (
    <section className="solutions-section">

      <div className="section-heading">
        <span className="step-label">03</span>

        <h2>Possible Solutions</h2>

        <p>
          {loading
            ? 'Nexus is thinking through possible approaches...'
            : 'Nexus generated these approaches based on your problem.'}
        </p>
      </div>

      {loading ? (
        <div className="loading-card">
          <div className="loading-spinner"></div>

          <strong>Generating solutions</strong>

          <p>
            Nexus is evaluating different ways to solve the problem.
          </p>
        </div>
      ) : (
        <div className="solutions-grid">
          {solutions.map((solution, index) => (
            <SolutionCard
              key={index}
              solution={solution}
              index={index}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

    </section>
  )
}

export default SolutionList