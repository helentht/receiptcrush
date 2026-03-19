# ReceiptCrush

A modern, collaborative web application designed to securely and efficiently split expenses among friends. Built with Next.js, Tailwind, and Supabase. Features AI-powered receipt parsing, multi-currency support, and an intelligent debt simplification algorithm.

## Getting Started

1. Copy `.env.local.example` to `.env.local` and add your Supabase and OpenRouter API keys.
2. Run `npm install` and then `npm run dev`.
3. Open http://localhost:3000

## Features

- Zero-login rooms via room code
- Qwen Vision receipt parsing (via OpenRouter)
- Real-time expense assignment
- Intelligent Settlement calculation

**Note on AI Models:** ReceiptCrush uses the standard `openai` SDK under the hood. You aren't locked into OpenRouter—just swap the `baseURL` in `src/app/api/process-receipt/route.ts` to easily use other OpenAI-compatible vision APIs (e.g., OpenAI, Gemini, Groq, or xAI).

