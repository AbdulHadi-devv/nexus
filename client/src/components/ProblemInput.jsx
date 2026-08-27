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
    <section className="nexus-workspace">

      <div className="problem-card">

        <div className="problem-card-header">
          <div>
            <span className="step-label">01</span>

            <h2>Describe your problem</h2>

            <p>
              What challenge are you trying to solve?
            </p>
          </div>

          <div className="ai-indicator">
            <span></span>
            AI POWERED
          </div>
        </div>

        <textarea
          value={problem}
          onChange={(event) => setProblem(event.target.value)}
          placeholder="Example: Students struggle to find good study resources for difficult topics..."
          rows="7"
        />

        <div className="problem-card-footer">

          <span className="character-count">
            {problem.length} characters
          </span>

          <button
            className="primary-button"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Analyze Problem →'}
          </button>

        </div>

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

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
        <div className="selected-solution">

          <div>
            <span className="step-label">03</span>

            <h2>Solution selected</h2>

            <h3>{selectedSolution.name}</h3>

            <p>{selectedSolution.description}</p>

            <span className="difficulty-badge">
              {selectedSolution.difficulty}
            </span>
          </div>

          <button
            className="primary-button"
            onClick={handleGenerateBlueprint}
            disabled={loading}
          >
            {loading
              ? 'Building Blueprint...'
              : 'Generate MVP Blueprint →'}
          </button>

        </div>
      )}

      {blueprint && (
        <Blueprint blueprint={blueprint} />
      )}

    </section>
  )
}

export default ProblemInput