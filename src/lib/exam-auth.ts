import type { User } from "@supabase/supabase-js";

import { examSupabase } from "../integrations/supabase/exam-client";
import type { Tables } from "../integrations/supabase/types";

export type ExamProfile = Tables<"profiles">;

const STUDENT_EMAIL_DOMAIN = "exam.scopenet.local";

export function normalizeStudentId(value: string) {
  return value.trim().toUpperCase();
}

function studentIdToAuthEmail(studentId: string) {
  return `${studentId.toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`;
}

async function getAuthenticatedProfile() {
  const { data: userData, error: userError } = await examSupabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Authentication could not be verified.");

  const { data: profile, error: profileError } = await examSupabase
    .from("profiles")
    .select("id, student_id, full_name, role, created_at, updated_at")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || !profile) throw new Error("Authentication could not be verified.");
  return { user: userData.user, profile };
}

export async function signInStudent(studentIdInput: string, password: string) {
  const studentId = normalizeStudentId(studentIdInput);
  if (!studentId || !password) throw new Error("Enter your Student ID and password.");

  const { error: signInError } = await examSupabase.auth.signInWithPassword({
    email: studentIdToAuthEmail(studentId),
    password,
  });

  if (signInError) throw new Error("Student ID or password is incorrect.");

  try {
    const { profile } = await getAuthenticatedProfile();
    if (profile.role !== "student" || profile.student_id !== studentId) throw new Error("Authentication could not be verified.");
    return profile;
  } catch {
    await examSupabase.auth.signOut();
    throw new Error("Student ID or password is incorrect.");
  }
}

export async function signInAdmin(email: string, password: string) {
  const normalizedEmail = email.trim();
  if (!normalizedEmail || !password) throw new Error("Enter your admin email and password.");

  const { error: signInError } = await examSupabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (signInError) throw new Error("Email or password is incorrect.");

  try {
    const { profile } = await getAuthenticatedProfile();
    if (profile.role !== "admin") throw new Error("Authentication could not be verified.");
    return profile;
  } catch {
    await examSupabase.auth.signOut();
    throw new Error("Email or password is incorrect.");
  }
}

export async function getExamSessionProfile(): Promise<{ user: User; profile: ExamProfile } | null> {
  const { data } = await examSupabase.auth.getSession();
  if (!data.session) return null;

  try {
    return await getAuthenticatedProfile();
  } catch {
    await examSupabase.auth.signOut();
    return null;
  }
}

export async function signOutExamUser() {
  const { error } = await examSupabase.auth.signOut();
  if (error) throw new Error("Logout failed. Please try again.");
}