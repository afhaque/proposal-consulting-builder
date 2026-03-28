# ProposalCraft

AI-powered proposal and consulting agreement builder. Three-tab UI with GitHub OAuth, LLM-driven generation, and PDF export.

## Stack

- Next.js 16, TypeScript, Tailwind CSS v4
- NextAuth.js v5 (GitHub OAuth)
- Radix UI (Tabs, Select, Dialog)
- jsPDF + html2canvas (PDF export)
- Anthropic / OpenAI / Google Gemini APIs

## Setup

```bash
cp .env.example .env
# Fill in your env vars
npm install
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `AUTH_SECRET` | NextAuth secret (generate with `npx auth secret`) |
| `AUTH_GITHUB_ID` | GitHub OAuth App Client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Client Secret |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude models |

## Features

- GitHub OAuth authentication
- Three-tab layout: Input, Configure, Output
- Sample project templates (Software Dev, Marketing, Business Strategy)
- LLM model selection (Claude, GPT-4o, Gemini)
- Configurable system prompts, tone, and length
- PDF download with optional logo
- Shareable state via encoded URL
- Settings persistence in localStorage
