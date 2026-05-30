// Compatibility shim: the app historically imported a Supabase client from here.
// The backend is now the standalone LifeOS REST API, so this re-exports a
// Supabase-JS-compatible client backed by that API. See src/integrations/api/.
import { apiClient } from '@/integrations/api/client';

// Import the client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = apiClient;
