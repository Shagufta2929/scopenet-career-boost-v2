import { createMiddleware } from "@tanstack/react-start";

import { examSupabase } from "./exam-client";

export const attachExamAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { data } = await examSupabase.auth.getSession();
    const token = data.session?.access_token;
    return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
  },
);