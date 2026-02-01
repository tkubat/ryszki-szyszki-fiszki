# Environment Variables Setup

## Local Development

For local development with Supabase, you need to create a `.env` file in the project root with the following variables:

```env
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_KEY="your_supabase_anon_key_here"
```

### Getting Local Supabase Credentials

1. Start Supabase locally:

   ```bash
   supabase start
   ```

2. Get environment variables:

   ```bash
   supabase status -o env
   ```

3. Copy `ANON_KEY` value to `SUPABASE_KEY` in your `.env` file
4. Use `API_URL` value for `SUPABASE_URL`

### Quick Setup Script (PowerShell)

```powershell
# Get Supabase status and create .env automatically
supabase status -o env | Select-String -Pattern "ANON_KEY|API_URL" | ForEach-Object {
    if ($_ -match 'API_URL="([^"]+)"') {
        "SUPABASE_URL=`"$($matches[1])`""
    }
    if ($_ -match 'ANON_KEY="([^"]+)"') {
        "SUPABASE_KEY=`"$($matches[1])`""
    }
} | Out-File -FilePath .env -Encoding utf8
```

## Production

For production deployment, use your Supabase project credentials:

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the following values:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_KEY`

4. Add these to your deployment platform's environment variables (e.g., Vercel, Netlify, etc.)

## Environment Variables Reference

| Variable       | Description                   | Required | Example                                                              |
| -------------- | ----------------------------- | -------- | -------------------------------------------------------------------- |
| `SUPABASE_URL` | Supabase project URL          | Yes      | `http://127.0.0.1:54321` (local) or `https://xxx.supabase.co` (prod) |
| `SUPABASE_KEY` | Supabase anonymous/public key | Yes      | `eyJhbGciOiJFUzI1NiIs...`                                            |

## Security Notes

- **Never commit `.env` file to version control** - it's already in `.gitignore`
- The `SUPABASE_KEY` is the **anon/public key**, not the service role key
- Service role key should never be exposed to the client
- Row Level Security (RLS) policies protect data even with the public key

## Troubleshooting

### Error: "supabaseUrl is required"

This means the `.env` file is missing or not loaded correctly:

1. Ensure `.env` file exists in project root
2. Restart the dev server after creating/modifying `.env`
3. Verify the variable names match exactly: `SUPABASE_URL` and `SUPABASE_KEY`

### Error: "Invalid API key"

1. Verify you're using the correct key for your environment (local vs production)
2. Check that there are no extra spaces or quotes in the `.env` file
3. Ensure Supabase is running (`supabase start` for local)
