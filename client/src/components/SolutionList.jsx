import SolutionCard from './SolutionCard'

function SolutionList({ solutions, onSelect }) {
  return (
    <div>
      <h2>Possible Solutions</h2>

      {solutions.map((solution, index) => (
        <SolutionCard
          key={index}
          solution={solution}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

export default SolutionList