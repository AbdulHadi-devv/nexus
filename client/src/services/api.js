const API_URL = 'http://localhost:5000/api'

export async function analyzeProblem(problem) {
  const response = await fetch(`${API_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ problem })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || data.message)
  }

  return data
}

export async function generateSolutions(problem, analysis) {
  const response = await fetch(`${API_URL}/solutions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      problem,
      analysis
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || data.message)
  }

  return data
}

export async function generateBlueprint(problem, analysis, solution) {
  const response = await fetch(`${API_URL}/blueprint`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      problem,
      analysis,
      solution
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || data.message)
  }

  return data
}