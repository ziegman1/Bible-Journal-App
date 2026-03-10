"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function SupabaseCheckButton() {
  const [result, setResult] = useState<{ ok: boolean; message?: string; error?: string; detail?: string; hint?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCheck() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/supabase-check");
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ ok: false, error: "Request failed", hint: "The check endpoint could not be reached." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCheck}
        disabled={loading}
        className="w-full"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Check Supabase connection
      </Button>
      {result && (
        <div
          className={`text-xs p-3 rounded-lg ${
            result.ok
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
              : "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200"
          }`}
        >
          {result.ok ? (
            <p>{result.message}</p>
          ) : (
            <div className="space-y-1">
              <p className="font-medium">{result.error}</p>
              {result.detail && <p className="opacity-90">{result.detail}</p>}
              {result.hint && (
                <p className="mt-1 whitespace-pre-line">{result.hint}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
