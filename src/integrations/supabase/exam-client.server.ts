import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createExamSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createExamSupabaseAdminClient() {
  const examSupabaseUrl = process.env["EXAM_SUPABASE_URL"];
  const examSupabaseServiceRoleKey = process.env["EXAM_SUPABASE_SERVICE_ROLE_KEY"];

  if (!examSupabaseUrl || !examSupabaseServiceRoleKey) {
    const missing = [
      ...(!examSupabaseUrl ? ["EXAM_SUPABASE_URL"] : []),
      ...(!examSupabaseServiceRoleKey ? ["EXAM_SUPABASE_SERVICE_ROLE_KEY"] : []),
    ];
    throw new Error(`Missing Exam Portal Supabase environment variable(s): ${missing.join(", ")}`);
  }

  return createClient<Database>(examSupabaseUrl, examSupabaseServiceRoleKey, {
    global: {
      fetch: createExamSupabaseFetch(examSupabaseServiceRoleKey),
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let examSupabaseAdminClient: ReturnType<typeof createExamSupabaseAdminClient> | undefined;

// Import this module only from trusted server-side code. Never expose the service-role key to the browser.
export const examSupabaseAdmin = new Proxy({} as ReturnType<typeof createExamSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!examSupabaseAdminClient) examSupabaseAdminClient = createExamSupabaseAdminClient();
    return Reflect.get(examSupabaseAdminClient, prop, receiver);
  },
});
