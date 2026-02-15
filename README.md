# Remake Design in Nostalgia Vibe

This is a code bundle for Remake Design in Nostalgia Vibe. The original project is available at https://www.figma.com/design/yplzgnBGLrcDElRBD1PAGi/Remake-Design-in-Nostalgia-Vibe.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Huruf game backend notes

### Durable Object (required)
- `wrangler.toml` already includes `HURUF_SESSION_DO` binding and migration.
- Deploy with:
  - `npx wrangler deploy`

### D1 (optional, only if you want DB-backed questions/logging)
Current implementation does **not** require D1.
If later needed, these are the common commands:
- `npx wrangler d1 create huruf_db`
- `npx wrangler d1 execute huruf_db --command "CREATE TABLE IF NOT EXISTS huruf_questions (id TEXT PRIMARY KEY, letter TEXT NOT NULL, prompt TEXT NOT NULL, answer TEXT NOT NULL);"`
- `npx wrangler d1 execute huruf_db --command "CREATE TABLE IF NOT EXISTS huruf_events (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, event_type TEXT NOT NULL, payload TEXT, created_at INTEGER NOT NULL);"`
