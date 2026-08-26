function ProblemAnalysis({ analysis, onGenerateSolutions, loading }) {
  return (
    <div>
      <h2>Problem Analysis</h2>

      <h3>Target Users</h3>
      <p>{analysis.targetUsers}</p>

      <h3>Core Problem</h3>
      <p>{analysis.coreProblem}</p>

      <h3>Why It Matters</h3>
      <p>{analysis.whyItMatters}</p>

      <h3>Pain Points</h3>

      <ul>
        {analysis.painPoints.map((painPoint, index) => (
          <li key={index}>{painPoint}</li>
        ))}
      </ul>

      <button onClick={onGenerateSolutions} disabled={loading}>
        {loading ? 'Generating Solutions...' : 'Generate Solutions'}
      </button>
    </div>
  )
}

export default ProblemAnalysis