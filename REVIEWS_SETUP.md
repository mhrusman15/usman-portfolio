# Reviews feature (Supabase)

Visitors can submit a review with **name**, **email**, optional **profile photo**, **1–5 stars**, and **text**. Rows are saved as **`pending`**. Only **`approved`** reviews appear on the site. **Email is stored for you** and is **not** selected in the app for public display.

---

## Step 1: Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. **New project** → choose organization, name, database password, region.
3. Wait until the project finishes provisioning.

---

## Step 2: Run the database SQL

1. In Supabase: **SQL Editor** → **New query**.
2. Open `supabase/migrations/001_reviews.sql` in this repo, copy the full file, paste into the editor.
3. Click **Run**. You should see no errors.

This creates:

- Table **`reviews`** with `status`: `pending` | `approved` | `rejected`
- **RLS** so anonymous users can **insert** only `pending`, and **read** only `approved`
- Storage bucket **`review-avatars`** (public) with policies so visitors can **upload** avatars

---

## Step 3: API keys in your app

1. Supabase: **Project Settings** → **API**.
2. Copy **Project URL** and **`anon` `public` key** (not the `service_role` key).
3. In the project root, create **`.env`** (same folder as `package.json`):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

4. Restart the dev server (`npm run dev`) after changing `.env`.

`.env` is gitignored; use `.env.example` as a template.

---

## Step 4: Approve or delete reviews (moderation)

1. Supabase → **Table Editor** → **`reviews`**.
2. New submissions appear with **`status` = `pending`** (you can sort by **`created_at`**).
3. To **publish** on the portfolio: set **`status`** to **`approved`**.
4. To **hide** without deleting: set **`status`** to **`rejected`** (the site only loads `approved`).
5. To **remove** completely: delete the row.

There is no admin UI in this repo; the dashboard is your moderation panel.

---

## Step 5: Email when someone submits (optional)

Supabase does not email you automatically on insert. Pick one:

### A) Webhook URL (built into this app)

Set in `.env`:

```env
VITE_REVIEW_NOTIFY_WEBHOOK=https://hooks.zapier.com/hooks/catch/...
```

(or a **Make** webhook, **Discord** incoming webhook, etc.)

After a successful submit, the site sends a **POST** with JSON like:

```json
{
  "name": "...",
  "email": "...",
  "rating": 5,
  "body_preview": "first 280 chars...",
  "submitted_at": "ISO timestamp",
  "message": "New portfolio review pending approval"
}
```

Configure the automation to **email you**.  
Note: the webhook URL is visible in the built frontend bundle; use a **disposable / scoped** automation URL, not a master API key.

### B) Supabase Database Webhooks

In Supabase: **Database** → **Webhooks** → create a webhook on **`reviews`** **INSERT** to your server or automation URL.

### C) No automation

Open **Table Editor** periodically and filter **`status` = `pending`**.

---

## Step 6: Production (e.g. Vercel)

Add the same **`VITE_***`** variables in the host’s **Environment Variables**, redeploy.

---

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| Submit fails | SQL migration ran; RLS policies exist; keys in `.env` are correct |
| Upload fails | Bucket **`review-avatars`** exists and is **public**; storage policies from SQL applied |
| Reviews don’t show | Row **`status`** must be **`approved`** |
| Yellow hint on site | Missing **`VITE_SUPABASE_URL`** or **`VITE_SUPABASE_ANON_KEY`** |

---

## Changing footer text (“Portfolio review”)

Edit the label next to the globe icon in `src/components/Reviews.tsx` inside `ReviewCard`.
