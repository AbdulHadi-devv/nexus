# Nexus

AI-powered knowledge engine that turns problem statements into structured MVP blueprints.

**Live:** https://nexus-hadi.netlify.app

## What it does

Describe a problem → Nexus analyzes it → generates solutions → produces a full MVP blueprint (features, pages, tech stack, database, tasks, build order). Every blueprint is saved to your personal knowledge base alongside notes, bookmarks, code snippets, ideas, and resources.

Also includes: tags, connections, knowledge graph, stats dashboard, search, favorites, keyboard shortcuts, dark mode, JSON export/import, shareable blueprint links.

## Stack

- Frontend: React 18 + Vite (Netlify)
- Backend: Node.js + Express (Render)
- Database: PostgreSQL + Prisma (Neon)
- AI: Google Gemini + Groq

## Live URLs

- Frontend: https://nexus-hadi.netlify.app
- Backend: https://nexus-backend-dae7.onrender.com
- Health: https://nexus-backend-dae7.onrender.com/api/health

> Backend uses Render's free tier — first request after 15 min idle takes ~30s to wake.

## Run locally

```bash
git clone https://github.com/AbdulHadi-devv/nexus.git
cd nexus
cd server && npm install
cd ../client && npm install
