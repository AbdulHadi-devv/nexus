import { useState } from 'react'
import ProblemInput from './components/ProblemInput'
import ProblemAnalysis from './components/ProblemAnalysis'
import SolutionList from './components/SolutionList'
import Blueprint from './components/Blueprint'
import {
  analyzeProblem,
  generateSolutions,
  generateBlueprint,
} from './services/api'
import './App.css'

function App() {
  const [problem, setProblem] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [solutions, setSolutions] = useState([])
  const [selectedSolution, setSelectedSolution] = useState(null)
  const [blueprint, setBlueprint] = useState(null)

  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [solutionsLoading, setSolutionsLoading] = useState(false)
  const [blueprintLoading, setBlueprintLoading] = useState(false)

  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!problem.trim()) {
      setError('Please describe a problem first.')
      return
    }

    setError('')
    setAnalysis(null)
    setSolutions([])
    setSelectedSolution(null)
    setBlueprint(null)
    setAnalysisLoading(true)

    try {
      const result = await analyzeProblem(problem)
      setAnalysis(result)
    } catch (err) {
      console.error('Analysis error:', err)

      setError(
        'Nexus could not analyze the problem right now. Please try again.'
      )
    } finally {
      setAnalysisLoading(false)
    }
  }

  const handleGenerateSolutions = async () => {
    if (!analysis) return

    setError('')
    setSolutions([])
    setSelectedSolution(null)
    setBlueprint(null)
    setSolutionsLoading(true)

    try {
      const result = await generateSolutions(problem, analysis)
      setSolutions(result)
    } catch (err) {
      console.error('Solutions error:', err)

      setError(
        'Nexus could not generate solutions right now. The AI service may be temporarily busy. Please try again.'
      )
    } finally {
      setSolutionsLoading(false)
    }
  }

  const handleSelectSolution = async (solution) => {
    setSelectedSolution(solution)
    setBlueprint(null)
    setError('')
    setBlueprintLoading(true)

    try {
      const result = await generateBlueprint(
        problem,
        analysis,
        solution
      )

      setBlueprint(result)
    } catch (err) {
      console.error('Blueprint error:', err)

      setError(
        'Nexus could not generate the MVP blueprint right now. Please try again.'
      )
    } finally {
      setBlueprintLoading(false)
    }
  }

  return (
    <main className="app">

      {/* Header */}

      <header className="header">
        <div className="logo">
          NEXUS
        </div>

        <div className="header-badge">
          AI PRODUCT BUILDER
        </div>
      </header>


      {/* Hero */}

      <section className="hero">

        <div className="eyebrow">
          FROM PROBLEM TO PRODUCT
        </div>

        <h1>
          Turn problems into
          <span> ideas, solutions,</span>
          <br />
          and actionable MVPs.
        </h1>

        <p className="hero-description">
          Describe a problem. Nexus analyzes it, explores
          possible solutions, and creates a practical MVP
          blueprint you can actually build.
        </p>

      </section>


      {/* Main Workspace */}

      <div className="nexus-workspace">

        <ProblemInput
          problem={problem}
          setProblem={setProblem}
          onAnalyze={handleAnalyze}
          loading={analysisLoading}
        />

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {analysis && (
          <ProblemAnalysis
            analysis={analysis}
            onGenerateSolutions={handleGenerateSolutions}
            loading={solutionsLoading}
          />
        )}

        {(solutionsLoading || solutions.length > 0) && (
          <SolutionList
            solutions={solutions}
            onSelect={handleSelectSolution}
            loading={solutionsLoading}
          />
        )}

        {selectedSolution && (
          <div className="selected-solution">

            <div>
              <span className="card-label">
                SELECTED SOLUTION
              </span>

              <h3>
                {selectedSolution.name}
              </h3>

              <p>
                Nexus is using this solution to build your
                MVP blueprint.
              </p>
            </div>

          </div>
        )}

        {(blueprintLoading || blueprint) && (
          <Blueprint
            blueprint={blueprint}
            loading={blueprintLoading}
          />
        )}

      </div>


      {/* Footer */}

      <footer>
        <strong>NEXUS</strong>
        <br />
        Turn ideas into action.
      </footer>

    </main>
  )
}

export default App