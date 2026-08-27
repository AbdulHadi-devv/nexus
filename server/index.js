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

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Nexus API is running! 🚀",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Nexus API",
    endpoints: {
      health: "/api/health",
    },
  });
});

// AI Problem Analysis
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

Analyze the following problem:

"${problem}"

Return your response in this exact structure:

## Target Users
Who experiences this problem?

## Core Problem
What is the main problem?

## Why It Matters
Why is solving this problem valuable?

## Pain Points
List 3 specific pain points.

Keep the response concise, practical, and easy to understand.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({
      success: true,
      analysis: response.text,
    });
  } catch (error) {
    console.error("AI analysis error:", error);

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

    res.status(500).json({
      error: "Unable to analyze the problem right now.",
      code: "AI_ERROR",
    });
  }
});

// AI Solutions
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

Based on this problem:

"${problem}"

And this analysis:

${analysis || "No previous analysis provided."}

Generate exactly 3 practical solution ideas.

For each solution provide:

1. Solution name
2. Short description
3. Key features (3 to 5)
4. Pros (2 to 3)
5. Cons (2 to 3)
6. Difficulty: Easy, Medium, or Hard

Keep the ideas realistic and suitable for an MVP.

Return the response as valid JSON in this format:

{
  "solutions": [
    {
      "name": "Solution name",
      "description": "Short description",
      "features": ["Feature 1", "Feature 2", "Feature 3"],
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1", "Con 2"],
      "difficulty": "Medium"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    let text = response.text.trim();

    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const solutions = JSON.parse(text);

    res.json({
      success: true,
      solutions: solutions.solutions,
    });
  } catch (error) {
    console.error("AI solutions error:", error);

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

    res.status(500).json({
      error: "Unable to generate solutions right now.",
      code: "AI_ERROR",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Nexus server is running on http://localhost:${PORT}`);
  console.log(
    `📡 Health check available at http://localhost:${PORT}/api/health`
  );
});