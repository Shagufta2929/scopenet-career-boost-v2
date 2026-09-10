import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";
import { brokeredPreviewStorage } from "./previewAuthStorage";

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

function createExamSupabaseClient() {
  const examSupabaseUrl = import.meta.env["VITE_EXAM_SUPABASE_URL"];
  const examSupabasePublishableKey = import.meta.env["VITE_EXAM_SUPABASE_PUBLISHABLE_KEY"];

  if (!examSupabaseUrl || !examSupabasePublishableKey) {
    const missing = [
      ...(!examSupabaseUrl ? ["VITE_EXAM_SUPABASE_URL"] : []),
      ...(!examSupabasePublishableKey ? ["VITE_EXAM_SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    throw new Error(`Missing Exam Portal Supabase environment variable(s): ${missing.join(", ")}`);
  }

  return createClient<Database>(examSupabaseUrl, examSupabasePublishableKey, {
    global: {
      fetch: createExamSupabaseFetch(examSupabasePublishableKey),
    },
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let examSupabaseClient: ReturnType<typeof createExamSupabaseClient> | undefined;

export const examSupabase = new Proxy({} as ReturnType<typeof createExamSupabaseClient>, {
  get(_, prop, receiver) {
    if (!examSupabaseClient) examSupabaseClient = createExamSupabaseClient();
    return Reflect.get(examSupabaseClient, prop, receiver);
  },
});
