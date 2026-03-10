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

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    const message =
      error.message?.toLowerCase().includes("fetch") ||
      error.message?.toLowerCase().includes("network")
        ? "Unable to connect. Please check your internet connection and try again."
        : error.message;
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
