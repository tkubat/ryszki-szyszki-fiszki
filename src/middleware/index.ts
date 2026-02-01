import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types";

/**
 * Astro middleware for Supabase authentication
 *
 * Creates an authenticated Supabase client for each request by:
 * 1. Extracting the Authorization header from the request
 * 2. Creating a new client instance with the auth token
 * 3. Injecting the client into context.locals for use in API routes
 *
 * This ensures that all API requests are properly authenticated and
 * Row Level Security (RLS) policies work correctly in Supabase.
 */
export const onRequest = defineMiddleware((context, next) => {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_KEY;

  // Create Supabase client with auth headers from the request
  // This allows RLS policies to work correctly by identifying the authenticated user
  context.locals.supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: context.request.headers.get("Authorization") ?? "",
      },
    },
  });

  return next();
});
