require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { GoogleGenAI } = require('@google/genai')

const app = express()
const PORT = process.env.PORT || 5000

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
})

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Nexus API is running! 🚀',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// AI problem analysis
app.post('/api/analyze', async (req, res) => {
  const { problem } = req.body

  if (!problem || !problem.trim()) {
    return res.status(400).json({
      message: 'Problem description is required.'
    })
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `
You are Nexus, an AI product discovery assistant.

Analyze the following problem:

"${problem}"

Return ONLY valid JSON in this exact structure:

{
  "targetUsers": "Who experiences this problem",
  "coreProblem": "The main problem in one clear sentence",
  "whyItMatters": "Why solving this problem matters",
  "painPoints": [
    "Pain point 1",
    "Pain point 2",
    "Pain point 3"
  ]
}

Do not include markdown.
Do not include explanations outside the JSON.
      `
    })

    const text = response.text
    const analysis = JSON.parse(text)

    res.json({
      problem,
      analysis
    })
  } catch (error) {
    console.error('AI analysis error:', error)

    res.status(500).json({
      message: 'Failed to analyze the problem.',
      error: error.message
    })
  }
})

app.post('/api/solutions', async (req, res) => {
  const { problem, analysis } = req.body

  if (!problem || !analysis) {
    return res.status(400).json({
      message: 'Problem and analysis are required.'
    })
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `
You are Nexus, an AI product discovery assistant.

A user has identified this problem:

"${problem}"

Here is the problem analysis:

${JSON.stringify(analysis, null, 2)}

Generate exactly 3 different potential product solutions.

Each solution must have:

- name
- description
- targetUsers
- keyFeatures: exactly 4 features
- pros: exactly 2 points
- cons: exactly 2 points
- difficulty: one of "Easy", "Medium", or "Hard"

Return ONLY valid JSON in this exact structure:

{
  "solutions": [
    {
      "name": "Solution name",
      "description": "What the product does",
      "targetUsers": "Who would use it",
      "keyFeatures": [
        "Feature 1",
        "Feature 2",
        "Feature 3",
        "Feature 4"
      ],
      "pros": [
        "Pro 1",
        "Pro 2"
      ],
      "cons": [
        "Con 1",
        "Con 2"
      ],
      "difficulty": "Easy"
    }
  ]
}

Do not include markdown.
Do not include explanations outside the JSON.
      `
    })

    const text = response.text
    const solutions = JSON.parse(text)

    res.json(solutions)
  } catch (error) {
    console.error('AI solutions error:', error)

    res.status(500).json({
      message: 'Failed to generate solutions.',
      error: error.message
    })
  }
})

app.post('/api/blueprint', async (req, res) => {
  const { problem, analysis, solution } = req.body

  if (!problem || !analysis || !solution) {
    return res.status(400).json({
      message: 'Problem, analysis, and solution are required.'
    })
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `
You are Nexus, an AI product development assistant.

The original problem is:

"${problem}"

Problem analysis:

${JSON.stringify(analysis, null, 2)}

The user selected this solution:

${JSON.stringify(solution, null, 2)}

Create a realistic MVP blueprint for this product.

Return ONLY valid JSON using this exact structure:

{
  "productName": "A suitable product name",
  "description": "A short description of the MVP",
  "coreFeatures": [
    "Feature 1",
    "Feature 2",
    "Feature 3",
    "Feature 4",
    "Feature 5"
  ],
  "pages": [
    {
      "name": "Page name",
      "purpose": "What this page does"
    }
  ],
  "techStack": {
    "frontend": "Recommended frontend technology",
    "backend": "Recommended backend technology",
    "database": "Recommended database",
    "other": [
      "Other technology or service"
    ]
  },
  "database": [
    {
      "name": "Table or collection name",
      "purpose": "What it stores"
    }
  ],
  "developmentTasks": [
    "Task 1",
    "Task 2",
    "Task 3",
    "Task 4",
    "Task 5"
  ],
  "buildOrder": [
    "Step 1",
    "Step 2",
    "Step 3",
    "Step 4",
    "Step 5"
  ]
}

Keep the MVP realistic for a small development team.

Do not include unnecessary features.
Do not include markdown.
Do not include explanations outside the JSON.
      `
    })

    const text = response.text
    const blueprint = JSON.parse(text)

    res.json(blueprint)
  } catch (error) {
    console.error('AI blueprint error:', error)

    res.status(500).json({
      message: 'Failed to generate MVP blueprint.',
      error: error.message
    })
  }
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Nexus API',
    endpoints: {
      health: '/api/health',
      analyze: '/api/analyze'
    }
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Nexus server is running on http://localhost:${PORT}`)
  console.log(`📡 Health check available at http://localhost:${PORT}/api/health`)
})