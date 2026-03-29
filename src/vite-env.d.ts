/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Optional: POST JSON payload after a review is submitted (Zapier, Make, Discord webhook, etc.). */
  readonly VITE_REVIEW_NOTIFY_WEBHOOK?: string;
  /** Optional EmailJS — public key from https://www.emailjs.com */
  readonly VITE_EMAILJS_PUBLIC_KEY?: string;
  readonly VITE_EMAILJS_SERVICE_ID?: string;
  readonly VITE_EMAILJS_TEMPLATE_ID?: string;
  /** Optional: direct link to your Supabase Table Editor for `reviews` (shown in email body). */
  readonly VITE_REVIEW_SUPABASE_TABLE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
