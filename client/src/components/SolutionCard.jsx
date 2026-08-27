function SolutionCard({ solution, index, onSelect }) {
  return (
    <article className="solution-card">

      <div className="solution-card-top">
        <span className="solution-number">
          {String(index + 1).padStart(2, '0')}
        </span>

        <span className="difficulty-badge">
          {solution.difficulty}
        </span>
      </div>

      <h3>{solution.name}</h3>

      <p className="solution-description">
        {solution.description}
      </p>

      <div className="solution-section">
        <span className="card-label">KEY FEATURES</span>

        <ul>
          {solution.keyFeatures.map((feature, featureIndex) => (
            <li key={featureIndex}>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="solution-section">
        <span className="card-label">TARGET USERS</span>

        <p>{solution.targetUsers}</p>
      </div>

      <div className="solution-section pros-cons">

        <div>
          <span className="card-label">PROS</span>

          <ul>
            {solution.pros.map((pro, proIndex) => (
              <li key={proIndex}>{pro}</li>
            ))}
          </ul>
        </div>

        <div>
          <span className="card-label">CONS</span>

          <ul>
            {solution.cons.map((con, conIndex) => (
              <li key={conIndex}>{con}</li>
            ))}
          </ul>
        </div>

      </div>

      <button
        className="solution-button"
        onClick={() => onSelect(solution)}
      >
        Choose this solution →
      </button>

    </article>
  )
}

export default SolutionCard