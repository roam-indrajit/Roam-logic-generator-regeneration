# JSON Schema Generator

Generates game logic JSON structures with persistent storage.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` file with:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ASSISTANT_ID=your_assistant_id
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

NOTE: Ensure no system-level OpenAI API key environment variables are set to avoid conflicts.

## API Endpoints

- `POST /api/generate` - Generate new JSON schema
- `GET /api/results` - Get all stored results
- `GET /api/results?id=1` - Get specific result by ID

Results are stored in SQLite database (`schema_results.db`).

## Deploy to Vercel

1. Initial deployment:
   ```bash
   vercel
   ```

2. Add environment variables in Vercel dashboard:
   - Project Settings > Environment Variables
   - Add `OPENAI_API_KEY` and `ASSISTANT_ID`

3. Update deployment (after making changes):
   ```bash
   vercel deploy --prod
   ```
   Or push to GitHub for automatic deployments.

Note: The SQLite database is stored in the filesystem. For Vercel deployment, consider using a proper database service like PostgreSQL.
# Roam-JSON-gen
update 4