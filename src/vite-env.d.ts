/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Optional: POST JSON payload after a review is submitted (Zapier, Make, Discord webhook, etc.). */
  readonly VITE_REVIEW_NOTIFY_WEBHOOK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
