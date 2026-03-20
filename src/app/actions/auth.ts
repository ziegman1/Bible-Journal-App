"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) {
    redirect("/setup");
  }
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;
  const redirectTo = formData.get("redirectTo") as string | null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const callbackUrl =
    redirectTo && (redirectTo.startsWith("/app") || redirectTo === "/onboarding")
      ? `${baseUrl}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
      : `${baseUrl}/auth/callback`;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: callbackUrl,
    },
  });

  if (error) {
    const msg = error.message?.toLowerCase() ?? "";
    let message: string;
    if (msg.includes("fetch") || msg.includes("network")) {
      message = "Unable to connect. Please check your internet connection and try again.";
    } else if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("duplicate")) {
      message = "An account with this email already exists. Try signing in instead.";
    } else if (msg.includes("database") || msg.includes("profiles") || msg.includes("relation") || msg.includes("does not exist")) {
      message = "Database setup issue. The app owner needs to run the SQL migrations in Supabase (see SUPABASE_SETUP.md).";
    } else if (msg.includes("password") && (msg.includes("weak") || msg.includes("length"))) {
      message = "Password must be at least 6 characters.";
    } else {
      message = error.message ?? "Something went wrong. Please try again.";
    }
    redirect(`/signup?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/login?message=Check your email to confirm your account");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) {
    redirect("/setup");
  }
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirectTo") as string | null;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message =
      error.message?.toLowerCase().includes("fetch") ||
      error.message?.toLowerCase().includes("network")
        ? "Unable to connect. Please check your internet connection and try again."
        : error.message;
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/", "layout");
  const target = redirectTo?.startsWith("/app") || redirectTo === "/onboarding"
    ? redirectTo
    : "/app";
  redirect(target);
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) {
    redirect("/setup");
  }
  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/app`,
  });

  if (error) {
    const message =
      error.message?.toLowerCase().includes("fetch") ||
      error.message?.toLowerCase().includes("network")
        ? "Unable to connect. Please check your internet connection and try again."
        : error.message;
    redirect(`/forgot-password?error=${encodeURIComponent(message)}`);
  }

  redirect("/forgot-password?message=Check your email for the reset link");
}

export async function signOut() {
  const supabase = await createClient();
  if (!supabase) {
    revalidatePath("/", "layout");
    redirect("/");
  }
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/** Sign out then send user to login with redirectTo (invite flow). Server-enforced path allowlist. */
export async function signOutWithLoginRedirect(formData: FormData) {
  const raw = formData.get("redirectTo");
  const redirectTo =
    typeof raw === "string" &&
    raw.startsWith("/app/groups/invite/") &&
    !raw.includes("//") &&
    !raw.includes("\n")
      ? raw
      : "/app";

  const supabase = await createClient();
  if (!supabase) {
    redirect("/setup");
  }
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
}
