# AT Devices for Kids — Custom Chatbot

## Quick start
1) `npm i`
2) Put your API keys in `.env.local` (see example below).
3) `npm run ingest`
4) `npm run dev`

## Deploy
- Push to a GitHub repo and import into Vercel.
- Set the same env vars in Vercel.
- Embed the widget:

```html
<script defer src="https://YOUR-VERCEL-APP.vercel.app/widget.js"></script>
```

## .env.local example
```
LLM_API_KEY=sk-...
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_MODEL=gpt-4o-mini
EMBED_API_URL=https://api.openai.com/v1/embeddings
EMBED_MODEL=text-embedding-3-small

SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.org
SMTP_PASS=yourpassword
SMTP_FROM=AT Devices for Kids <postmaster@yourdomain.org>
HANDOFF_TO_EMAIL=info@atdevicesforkids.org
```