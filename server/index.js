const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function cleanJsonText(text) {
  if (!text) return "";

  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseAIJson(text) {
  const cleaned = cleanJsonText(text);

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to parse AI JSON:", cleaned);
    throw new Error("AI returned invalid JSON.");
  }
}

function handleAIError(res, error, operation) {
  console.error(`AI ${operation} error:`, error);

  if (error.status === 429) {
    return res.status(429).json({
      error: "AI quota reached. Please try again later.",
      code: "QUOTA_EXCEEDED",
    });
  }

  if (error.status === 503) {
    return res.status(503).json({
      error: "The AI service is temporarily busy. Please try again.",
      code: "AI_UNAVAILABLE",
    });
  }

  return res.status(500).json({
    error: `Unable to ${operation} right now.`,
    code: "AI_ERROR",
  });
}

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Nexus API is running! 🚀",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// --------------------------------------------------
// Root route
// --------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Nexus API",
    endpoints: {
      health: "/api/health",
      analyze: "/api/analyze",
      solutions: "/api/solutions",
      blueprint: "/api/blueprint",
    },
  });
});

// --------------------------------------------------
// AI Problem Analysis
// --------------------------------------------------

app.post("/api/analyze", async (req, res) => {
  try {
    const { problem } = req.body;

    if (!problem || !problem.trim()) {
      return res.status(400).json({
        error: "Please provide a problem to analyze.",
      });
    }

    const prompt = `
You are Nexus, an AI problem-solving assistant.

Analyze this problem:

"${problem}"

Return ONLY valid JSON.

Use exactly this structure:

{
  "targetUsers": "Who experiences this problem?",
  "coreProblem": "What is the main problem?",
  "whyItMatters": "Why is solving this problem valuable?",
  "painPoints": [
    "Specific pain point 1",
    "Specific pain point 2",
    "Specific pain point 3"
  ]
}

Requirements:
- Keep the analysis concise.
- Identify the most relevant target users.
- Clearly explain the central problem.
- Explain why solving it matters.
- Provide exactly 3 specific pain points.
- Do not include Markdown.
- Do not include code fences.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const analysis = parseAIJson(response.text);

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    handleAIError(res, error, "analyze the problem");
  }
});

// --------------------------------------------------
// AI Solutions
// --------------------------------------------------

app.post("/api/solutions", async (req, res) => {
  try {
    const { problem, analysis } = req.body;

    if (!problem || !problem.trim()) {
      return res.status(400).json({
        error: "Please provide a problem.",
      });
    }

    const prompt = `
You are Nexus, an AI product strategist.

Problem:

"${problem}"

Problem analysis:

${JSON.stringify(analysis || {}, null, 2)}

Generate exactly 3 practical solution ideas.

Return ONLY valid JSON using exactly this structure:

{
  "solutions": [
    {
      "name": "Solution name",
      "description": "Short description",
      "features": [
        "Feature 1",
        "Feature 2",
        "Feature 3"
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

Requirements:
- Exactly 3 solutions.
- Each solution must have 3 to 5 features.
- Each solution must have 2 to 3 pros.
- Each solution must have 2 to 3 cons.
- Difficulty must be exactly one of: Easy, Medium, Hard.
- Ideas must be realistic and suitable for an MVP.
- Do not include Markdown.
- Do not include code fences.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = parseAIJson(response.text);

    if (!result.solutions || !Array.isArray(result.solutions)) {
      throw new Error("AI returned an invalid solutions structure.");
    }

    res.json({
      success: true,
      solutions: result.solutions,
    });
  } catch (error) {
    handleAIError(res, error, "generate solutions");
  }
});

// --------------------------------------------------
// AI MVP Blueprint
// --------------------------------------------------

app.post("/api/blueprint", async (req, res) => {
  try {
    const { problem, analysis, solution } = req.body;

    if (!problem || !problem.trim()) {
      return res.status(400).json({
        error: "Please provide a problem.",
      });
    }

    if (!solution) {
      return res.status(400).json({
        error: "Please select a solution first.",
      });
    }

    const prompt = `
You are Nexus, an AI product architect.

Create a practical MVP blueprint based on the following information.

PROBLEM:
${problem}

PROBLEM ANALYSIS:
${JSON.stringify(analysis || {}, null, 2)}

SELECTED SOLUTION:
${JSON.stringify(solution, null, 2)}

Return ONLY valid JSON using exactly this structure:

{
  "title": "Short product name",
  "summary": "A concise explanation of what this MVP does.",
  "features": [
    {
      "name": "Feature name",
      "description": "What this feature does."
    },
    {
      "name": "Feature name",
      "description": "What this feature does."
    },
    {
      "name": "Feature name",
      "description": "What this feature does."
    },
    {
      "name": "Feature name",
      "description": "What this feature does."
    }
  ],
  "pages": [
    {
      "name": "Page name",
      "description": "What the user can do on this page."
    },
    {
      "name": "Page name",
      "description": "What the user can do on this page."
    },
    {
      "name": "Page name",
      "description": "What the user can do on this page."
    }
  ],
  "techStack": {
    "frontend": "Recommended frontend technology",
    "backend": "Recommended backend technology",
    "ai": "Recommended AI technology",
    "database": "Recommended database"
  },
  "database": [
    {
      "name": "Table or collection name",
      "description": "What data it stores."
    },
    {
      "name": "Table or collection name",
      "description": "What data it stores."
    },
    {
      "name": "Table or collection name",
      "description": "What data it stores."
    }
  ],
  "tasks": [
    "Development task 1",
    "Development task 2",
    "Development task 3",
    "Development task 4",
    "Development task 5"
  ],
  "buildOrder": [
    "First thing to build",
    "Second thing to build",
    "Third thing to build",
    "Fourth thing to build",
    "Fifth thing to build"
  ]
}

Requirements:
- Design a realistic MVP, not a huge enterprise product.
- Keep the feature set focused.
- Recommend technologies suitable for a beginner/intermediate developer.
- Keep descriptions concise.
- Do not include Markdown.
- Do not include code fences.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const blueprint = parseAIJson(response.text);

    res.json({
      success: true,
      blueprint,
    });
  } catch (error) {
    handleAIError(res, error, "generate the MVP blueprint");
  }
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(`🚀 Nexus server is running on http://localhost:${PORT}`);
  console.log(
    `📡 Health check available at http://localhost:${PORT}/api/health`
  );
});