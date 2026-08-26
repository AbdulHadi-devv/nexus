function SolutionCard({ solution, onSelect }) {
  return (
    <article>
      <h3>{solution.name}</h3>

      <p>{solution.description}</p>

      <h4>Target Users</h4>
      <p>{solution.targetUsers}</p>

      <h4>Key Features</h4>

      <ul>
        {solution.keyFeatures.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>

      <h4>Pros</h4>

      <ul>
        {solution.pros.map((pro, index) => (
          <li key={index}>{pro}</li>
        ))}
      </ul>

      <h4>Cons</h4>

      <ul>
        {solution.cons.map((con, index) => (
          <li key={index}>{con}</li>
        ))}
      </ul>

      <p>
        <strong>Difficulty:</strong> {solution.difficulty}
      </p>

      <button onClick={() => onSelect(solution)}>
        Choose This Solution
      </button>
    </article>
  )
}

export default SolutionCard