const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Groq = require('groq-sdk');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

const AI_MODEL = "openai/gpt-oss-120b";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// AUTH MIDDLEWARE
// ========================================
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ========================================
// HELPERS
// ========================================
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

// ========================================
// HEALTH
// ========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Nexus API is running! 🚀',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Nexus API',
    endpoints: {
      auth: { register: 'POST /api/auth/register', login: 'POST /api/auth/login' },
      items: {
        create: 'POST /api/items', getAll: 'GET /api/items',
        getOne: 'GET /api/items/:id', update: 'PUT /api/items/:id',
        delete: 'DELETE /api/items/:id',
      },
      tags: {
        create: 'POST /api/tags', getAll: 'GET /api/tags',
        update: 'PUT /api/tags/:id', merge: 'POST /api/tags/:id/merge',
        delete: 'DELETE /api/tags/:id',
      },
      connections: {
        create: 'POST /api/connections', delete: 'DELETE /api/connections/:id',
        getByItem: 'GET /api/connections/item/:itemId',
      },
      search: 'GET /api/search?q=query',
      ai: {
        analyze: 'POST /api/analyze', solutions: 'POST /api/solutions',
        blueprint: 'POST /api/blueprint', suggestConnections: 'POST /api/suggest-connections',
      },
    },
  });
});

// ========================================
// AUTH ROUTES
// ========================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  res.json({
    user: { id: req.user.id, email: req.user.email, name: req.user.name },
  });
});

// ========================================
// KNOWLEDGE ITEM ROUTES
// ========================================
app.post('/api/items', authenticate, async (req, res) => {
  try {
    const { title, content, type, url, language, tagIds } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const item = await prisma.knowledgeItem.create({
      data: {
        title, content, type: type || 'NOTE', url, language,
        userId: req.user.id,
        tags: tagIds && tagIds.length > 0 ? {
          connect: tagIds.map(id => ({ id })),
        } : undefined,
      },
      include: { tags: true },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Failed to create knowledge item' });
  }
});

app.get('/api/items', authenticate, async (req, res) => {
  try {
    const items = await prisma.knowledgeItem.findMany({
      where: { userId: req.user.id },
      include: {
        tags: true,
        connectionsFrom: { include: { toItem: true } },
        connectionsTo: { include: { fromItem: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(items);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Failed to get items' });
  }
});

app.get('/api/items/:id', authenticate, async (req, res) => {
  try {
    const item = await prisma.knowledgeItem.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        tags: true,
        connectionsFrom: { include: { toItem: true } },
        connectionsTo: { include: { fromItem: true } },
      },
    });

    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Failed to get item' });
  }
});

app.put('/api/items/:id', authenticate, async (req, res) => {
  try {
    const { title, content, type, url, language, tagIds, favorite } = req.body;

    const existingItem = await prisma.knowledgeItem.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existingItem) return res.status(404).json({ error: 'Item not found' });

    const item = await prisma.knowledgeItem.update({
      where: { id: req.params.id },
      data: {
        title: title !== undefined ? title : existingItem.title,
        content: content !== undefined ? content : existingItem.content,
        type: type !== undefined ? type : existingItem.type,
        url: url !== undefined ? url : existingItem.url,
        language: language !== undefined ? language : existingItem.language,
        favorite: favorite !== undefined ? favorite : existingItem.favorite,
        tags: tagIds ? { set: tagIds.map(id => ({ id })) } : undefined,
      },
      include: { tags: true },
    });

    res.json(item);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.delete('/api/items/:id', authenticate, async (req, res) => {
  try {
    const existingItem = await prisma.knowledgeItem.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existingItem) return res.status(404).json({ error: 'Item not found' });

    await prisma.knowledgeItem.delete({ where: { id: req.params.id } });
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// ========================================
// TAG ROUTES
// ========================================
app.post('/api/tags', authenticate, async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const trimmedName = name.trim();

    const existing = await prisma.tag.findFirst({
      where: { name: trimmedName, userId: req.user.id },
    });

    if (existing) {
      return res.status(400).json({ error: `Tag "#${trimmedName}" already exists` });
    }

    const tag = await prisma.tag.create({
      data: {
        name: trimmedName,
        color: color || '#6366f1',
        userId: req.user.id,
      },
      include: { items: true },
    });

    res.status(201).json(tag);
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

app.get('/api/tags', authenticate, async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      where: { userId: req.user.id },
      include: {
        items: {
          select: { id: true, title: true, type: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(tags);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Failed to get tags' });
  }
});

app.put('/api/tags/:id', authenticate, async (req, res) => {
  try {
    const { name, color } = req.body;

    const existingTag = await prisma.tag.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existingTag) return res.status(404).json({ error: 'Tag not found' });

    const trimmedName = name ? name.trim() : existingTag.name;

    if (trimmedName !== existingTag.name) {
      const conflicting = await prisma.tag.findFirst({
        where: {
          name: trimmedName,
          userId: req.user.id,
          id: { not: req.params.id },
        },
      });

      if (conflicting) {
        return res.status(400).json({
          error: `A tag named "#${trimmedName}" already exists. Use merge instead.`,
        });
      }
    }

    const tag = await prisma.tag.update({
      where: { id: req.params.id },
      data: {
        name: trimmedName,
        color: color !== undefined ? color : existingTag.color,
      },
      include: { items: true },
    });

    res.json(tag);
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// ========================================
// MERGE TAGS (FIXED)
// ========================================
app.post('/api/tags/:id/merge', authenticate, async (req, res) => {
  try {
    const sourceTagId = req.params.id;
    const { targetTagId } = req.body;

    if (!targetTagId) {
      return res.status(400).json({ error: 'Target tag ID is required' });
    }

    if (sourceTagId === targetTagId) {
      return res.status(400).json({ error: 'Cannot merge a tag into itself' });
    }

    // Verify ownership of both tags
    const sourceTag = await prisma.tag.findFirst({
      where: { id: sourceTagId, userId: req.user.id },
    });

    const targetTag = await prisma.tag.findFirst({
      where: { id: targetTagId, userId: req.user.id },
    });

    if (!sourceTag || !targetTag) {
      return res.status(404).json({ error: 'One or both tags not found' });
    }

    // Get all items with the source tag
    const itemsWithSource = await prisma.knowledgeItem.findMany({
      where: {
        userId: req.user.id,
        tags: { some: { id: sourceTagId } },
      },
      select: { id: true },
    });

    // For each item: disconnect source tag, connect target tag
    // Prisma's update() (single record) supports relation operations
    for (const item of itemsWithSource) {
      await prisma.knowledgeItem.update({
        where: { id: item.id },
        data: {
          tags: {
            disconnect: { id: sourceTagId },
            connect: { id: targetTagId },
          },
        },
      });
    }

    // Delete the source tag
    await prisma.tag.delete({
      where: { id: sourceTagId },
    });

    res.json({
      success: true,
      message: `Merged ${itemsWithSource.length} item(s) into #${targetTag.name}`,
      itemsMerged: itemsWithSource.length,
      sourceTagName: sourceTag.name,
      targetTagName: targetTag.name,
    });
  } catch (error) {
    console.error('Merge tags error:', error);
    res.status(500).json({ error: 'Failed to merge tags' });
  }
});

app.delete('/api/tags/:id', authenticate, async (req, res) => {
  try {
    const tag = await prisma.tag.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!tag) return res.status(404).json({ error: 'Tag not found' });

    await prisma.tag.delete({ where: { id: req.params.id } });
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// ========================================
// CONNECTION ROUTES
// ========================================
app.post('/api/connections', authenticate, async (req, res) => {
  try {
    const { fromItemId, toItemId, type } = req.body;

    if (!fromItemId || !toItemId) {
      return res.status(400).json({ error: 'Both item IDs are required' });
    }

    if (fromItemId === toItemId) {
      return res.status(400).json({ error: 'Cannot connect an item to itself' });
    }

    const existingConnection = await prisma.connection.findFirst({
      where: { fromItemId, toItemId },
    });

    if (existingConnection) {
      return res.status(400).json({ error: 'Connection already exists' });
    }

    const connection = await prisma.connection.create({
      data: {
        fromItemId, toItemId,
        type: type || 'RELATED',
        userId: req.user.id,
      },
      include: { fromItem: true, toItem: true },
    });

    res.status(201).json(connection);
  } catch (error) {
    console.error('Create connection error:', error);
    res.status(500).json({ error: 'Failed to create connection' });
  }
});

app.delete('/api/connections/:id', authenticate, async (req, res) => {
  try {
    const connection = await prisma.connection.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!connection) return res.status(404).json({ error: 'Connection not found' });

    await prisma.connection.delete({ where: { id: req.params.id } });
    res.json({ message: 'Connection deleted successfully' });
  } catch (error) {
    console.error('Delete connection error:', error);
    res.status(500).json({ error: 'Failed to delete connection' });
  }
});

app.get('/api/connections/item/:itemId', authenticate, async (req, res) => {
  try {
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { fromItemId: req.params.itemId },
          { toItemId: req.params.itemId },
        ],
        userId: req.user.id,
      },
      include: { fromItem: true, toItem: true },
    });
    res.json(connections);
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ error: 'Failed to get connections' });
  }
});

// ========================================
// SEARCH ROUTE
// ========================================
app.get('/api/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const items = await prisma.knowledgeItem.findMany({
      where: {
        userId: req.user.id,
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
        ],
      },
      include: {
        tags: true,
        connectionsFrom: { include: { toItem: true } },
        connectionsTo: { include: { fromItem: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const tags = await prisma.tag.findMany({
      where: {
        userId: req.user.id,
        name: { contains: q },
      },
      include: {
        items: { where: { userId: req.user.id } },
      },
    });

    res.json({ items, tags });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search' });
  }
});

// ========================================
// AI ROUTES
// ========================================
app.post("/api/analyze", async (req, res) => {
  try {
    const { problem } = req.body;

    if (!problem || !problem.trim()) {
      return res.status(400).json({ error: "Please provide a problem to analyze." });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "API key not configured.", code: "MISSING_API_KEY" });
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

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful AI assistant that always responds with valid JSON." },
        { role: "user", content: prompt }
      ],
      model: AI_MODEL,
      temperature: 0.7,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const analysis = parseAIJson(completion.choices[0]?.message?.content || "");

    res.json({ success: true, analysis });
  } catch (error) {
    handleAIError(res, error, "analyze the problem");
  }
});

app.post("/api/solutions", async (req, res) => {
  try {
    const { problem, analysis } = req.body;

    if (!problem || !problem.trim()) {
      return res.status(400).json({ error: "Please provide a problem." });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "API key not configured.", code: "MISSING_API_KEY" });
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
      "features": ["Feature 1", "Feature 2", "Feature 3"],
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1", "Con 2"],
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

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful AI assistant that always responds with valid JSON." },
        { role: "user", content: prompt }
      ],
      model: AI_MODEL,
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    });

    const result = parseAIJson(completion.choices[0]?.message?.content || "");

    if (!result.solutions || !Array.isArray(result.solutions)) {
      throw new Error("AI returned an invalid solutions structure.");
    }

    res.json({ success: true, solutions: result.solutions });
  } catch (error) {
    handleAIError(res, error, "generate solutions");
  }
});

app.post("/api/blueprint", async (req, res) => {
  try {
    const { problem, analysis, solution } = req.body;

    if (!problem || !problem.trim()) {
      return res.status(400).json({ error: "Please provide a problem." });
    }

    if (!solution) {
      return res.status(400).json({ error: "Please select a solution first." });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "API key not configured.", code: "MISSING_API_KEY" });
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
  "features": [{ "name": "Feature name", "description": "What this feature does." }],
  "pages": [{ "name": "Page name", "description": "What the user can do on this page." }],
  "techStack": {
    "frontend": "Recommended frontend technology",
    "backend": "Recommended backend technology",
    "ai": "Recommended AI technology",
    "database": "Recommended database"
  },
  "database": [{ "name": "Table or collection name", "description": "What data it stores." }],
  "tasks": ["Task 1", "Task 2", "Task 3", "Task 4", "Task 5"],
  "buildOrder": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"]
}

Requirements:
- Design a realistic MVP, not a huge enterprise product.
- Keep the feature set focused.
- Recommend technologies suitable for a beginner/intermediate developer.
- Keep descriptions concise.
- Do not include Markdown.
- Do not include code fences.
`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful AI assistant that always responds with valid JSON." },
        { role: "user", content: prompt }
      ],
      model: AI_MODEL,
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    });

    const blueprint = parseAIJson(completion.choices[0]?.message?.content || "");
    res.json({ success: true, blueprint });
  } catch (error) {
    handleAIError(res, error, "generate the MVP blueprint");
  }
});

app.post("/api/suggest-connections", authenticate, async (req, res) => {
  try {
    const { itemId } = req.body;

    if (!itemId) return res.status(400).json({ error: "Item ID is required" });

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "API key not configured.", code: "MISSING_API_KEY" });
    }

    const currentItem = await prisma.knowledgeItem.findFirst({
      where: { id: itemId, userId: req.user.id },
      include: { tags: true },
    });

    if (!currentItem) return res.status(404).json({ error: "Item not found" });

    const otherItems = await prisma.knowledgeItem.findMany({
      where: { userId: req.user.id, id: { not: itemId } },
      include: { tags: true },
    });

    if (otherItems.length === 0) return res.json({ success: true, suggestions: [] });

    const existingConnections = await prisma.connection.findMany({
      where: {
        userId: req.user.id,
        OR: [{ fromItemId: itemId }, { toItemId: itemId }],
      },
    });

    const connectedIds = new Set();
    existingConnections.forEach(conn => {
      connectedIds.add(conn.fromItemId);
      connectedIds.add(conn.toItemId);
    });

    const candidates = otherItems.filter(item => !connectedIds.has(item.id));

    if (candidates.length === 0) {
      return res.json({ success: true, suggestions: [], message: "All items already connected." });
    }

    const prompt = `
You are analyzing a personal knowledge base to suggest meaningful connections.

CURRENT ITEM:
Title: "${currentItem.title}"
Type: ${currentItem.type}
Content: ${currentItem.content.substring(0, 500)}
Tags: ${currentItem.tags.map(t => t.name).join(', ') || 'none'}

CANDIDATE ITEMS:
${candidates.map((item) => `
ID: ${item.id}
Title: "${item.title}"
Type: ${item.type}
Content: ${item.content.substring(0, 300)}
Tags: ${item.tags.map(t => t.name).join(', ') || 'none'}
`).join('\n---\n')}

TASK:
Suggest up to 5 items from the candidates that are meaningfully related to the current item.

Return ONLY valid JSON:
{
  "suggestions": [
    { "id": "exact_candidate_item_id", "reason": "Brief reason (max 15 words)", "confidence": 0.85 }
  ]
}

Requirements:
- Only suggest items with clear relationships
- Return between 0 and 5 suggestions
- Confidence between 0 and 1
- Use EXACT candidate item IDs
- Do not include Markdown or code fences
`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You analyze knowledge relationships and respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      model: AI_MODEL,
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const result = parseAIJson(completion.choices[0]?.message?.content || "");

    if (!result.suggestions || !Array.isArray(result.suggestions)) {
      return res.json({ success: true, suggestions: [] });
    }

    const enrichedSuggestions = result.suggestions
      .map(sugg => {
        const item = candidates.find(c => c.id === sugg.id);
        if (!item) return null;
        return {
          item: { id: item.id, title: item.title, type: item.type },
          reason: sugg.reason || 'Related content',
          confidence: sugg.confidence || 0.5,
        };
      })
      .filter(Boolean)
      .slice(0, 5);

    res.json({ success: true, suggestions: enrichedSuggestions });
  } catch (error) {
    console.error("❌ Suggestion error:", error.message);
    res.status(500).json({ error: "Failed to generate suggestions", code: "AI_ERROR" });
  }
});

app.get("/api/test-ai", async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.json({ success: false, error: "GROQ_API_KEY is not set in .env" });
    }

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Say 'Hello, Nexus is working!' in a short sentence." }],
      model: AI_MODEL,
      max_tokens: 50,
    });

    res.json({
      success: true,
      message: "Groq API is working!",
      model: AI_MODEL,
      response: completion.choices[0]?.message?.content,
    });
  } catch (error) {
    res.json({ success: false, error: error.message, status: error.status });
  }
});

// ========================================
// START SERVER
// ========================================
app.listen(PORT, () => {
  console.log(`🚀 Nexus server is running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/`);
  console.log(`🤖 AI Model: ${AI_MODEL}`);
});