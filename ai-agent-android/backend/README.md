# Private AI Agent backend

Node.js API for the Doodle Outpost AI Agent Android app.

## Included
- OpenAI Responses API chat endpoint.
- Firebase Admin ID-token verification on every protected endpoint.
- Verified-email and single-admin allowlist enforcement.
- CORS origin allowlist, Helmet headers, JSON body limit and API rate limit.
- No GitHub write endpoint. No automatic publishing.

## Required environment variables
Copy `.env.example` values into the private environment settings of your backend host:
- `OPENAI_API_KEY`: create a project API key in the OpenAI Platform.
- `OPENAI_MODEL`: defaults to `gpt-6.2-astra`; set a model available to your API project if needed.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: Firebase Admin SDK service-account JSON, stored as a secret.
- `ADMIN_EMAIL`: `chandegaraharsh464@gmail.com`.
- `ALLOWED_ORIGINS`: allowed Android WebView and local development origins.

Never commit real secrets, Firebase service-account JSON, or API keys. The OpenAI API key must remain on the server, not in the APK.

## Run locally
```bash
npm install
cp .env.example .env
# Fill .env privately; do not commit it.
npm start
```

## Endpoints
- `GET /health`: public service health.
- `GET /api/admin/me`: protected admin identity check.
- `POST /api/agent/chat`: protected AI chat. Send a Firebase ID token as a Bearer token and JSON `{"message":"..."}`.

## Important status
The API scaffold is not deployed or live yet. The Android UI is not yet wired to this API. GitHub repository reading, patch generation, diff review, explicit approval, commit publishing, test execution and rollback are future milestones. Before any GitHub integration, use a narrowly scoped GitHub App or token on the backend and implement a server-side approval record for every write.

OpenAI API usage is billed separately from ChatGPT subscriptions. Set project usage limits and alerts before enabling production use.