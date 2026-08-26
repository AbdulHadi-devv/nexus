import { useState } from 'react'

import {
  analyzeProblem,
  generateSolutions,
  generateBlueprint
} from '../services/api'

import ProblemAnalysis from './ProblemAnalysis'
import SolutionList from './SolutionList'
import Blueprint from './Blueprint'

function ProblemInput() {
  const [problem, setProblem] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [solutions, setSolutions] = useState(null)
  const [selectedSolution, setSelectedSolution] = useState(null)
  const [blueprint, setBlueprint] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAnalyze() {
    if (!problem.trim()) {
      setError('Please describe a problem first.')
      return
    }

    setError('')
    setAnalysis(null)
    setSolutions(null)
    setSelectedSolution(null)
    setBlueprint(null)
    setLoading(true)

    try {
      const data = await analyzeProblem(problem)

      setAnalysis(data.analysis)
    } catch (error) {
      console.error('Analysis error:', error)
      setError('Could not analyze the problem.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateSolutions() {
    if (!analysis) return

    setError('')
    setSolutions(null)
    setSelectedSolution(null)
    setBlueprint(null)
    setLoading(true)

    try {
      const data = await generateSolutions(problem, analysis)

      setSolutions(data.solutions)
    } catch (error) {
      console.error('Solutions error:', error)
      setError('Could not generate solutions.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateBlueprint() {
    if (!selectedSolution) return

    setError('')
    setBlueprint(null)
    setLoading(true)

    try {
      const data = await generateBlueprint(
        problem,
        analysis,
        selectedSolution
      )

      setBlueprint(data)
    } catch (error) {
      console.error('Blueprint error:', error)
      setError('Could not generate the MVP blueprint.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <h2>What problem are you trying to solve?</h2>

      <textarea
        value={problem}
        onChange={(event) => setProblem(event.target.value)}
        placeholder="Describe the problem..."
        rows="6"
      />

      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Problem'}
      </button>

      {error && <p>{error}</p>}

      {analysis && (
        <ProblemAnalysis
          analysis={analysis}
          onGenerateSolutions={handleGenerateSolutions}
          loading={loading}
        />
      )}

      {solutions && (
        <SolutionList
          solutions={solutions}
          onSelect={setSelectedSolution}
        />
      )}

      {selectedSolution && (
        <div>
          <h2>Selected Solution</h2>

          <h3>{selectedSolution.name}</h3>

          <p>{selectedSolution.description}</p>

          <p>
            <strong>Difficulty:</strong>{' '}
            {selectedSolution.difficulty}
          </p>

          <button
            onClick={handleGenerateBlueprint}
            disabled={loading}
          >
            {loading
              ? 'Generating Blueprint...'
              : 'Generate MVP Blueprint'}
          </button>
        </div>
      )}

      {blueprint && <Blueprint blueprint={blueprint} />}
    </section>
  )
}

export default ProblemInput