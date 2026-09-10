import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { examSupabaseAdmin } from "./exam-client.server";

export const requireExamAdmin = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const authHeader = getRequest()?.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) throw new Error("Unauthorized");

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) throw new Error("Unauthorized");

    const { data, error } = await examSupabaseAdmin.auth.getUser(token);
    if (error || !data.user) throw new Error("Unauthorized");

    const { data: profile, error: profileError } = await examSupabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profileError || profile?.role !== "admin") throw new Error("Forbidden");

    return next({ context: { examAdminUserId: data.user.id } });
  },
);