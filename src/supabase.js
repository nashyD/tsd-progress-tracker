import { createClient } from "@supabase/supabase-js";

// Supabase anon/public key is designed to ship in frontend bundles.
// Security is enforced by Row Level Security policies on the `progress` table,
// which restrict all access to the single row with id = 'tsd-launch'.
const SUPABASE_URL = "https://pmufgmsfucstonzxtmvy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdWZnbXNmdWNzdG9uenh0bXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDYxMTcsImV4cCI6MjA5MTMyMjExN30.20QpENjVebJaa4qXOYk-uG0FBI44_9NSW-Hw40fXPk8";

export const TRACKER_ID = "tsd-launch";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 5 } },
});
