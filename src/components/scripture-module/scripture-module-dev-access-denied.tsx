import Link from "next/link";
import type {
  ScriptureModuleAccessDeniedReason,
  ScriptureModuleAccessResult,
} from "@/lib/scripture-module/access";
import { isNextJsDevelopment } from "@/lib/scripture-module/access";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type DebugSnapshot = {
  nodeEnv: string | undefined;
  isNextJsDevelopment: boolean;
  localDevEnvRaw: string | undefined;
  localDevParsedEnabled: boolean;
  adminEmailsPresent: boolean;
  adminEmailsLength: number;
  signedInEmail: string | null;
  access: ScriptureModuleAccessResult;
};

function shouldShowAccessDebugPanel(): boolean {
  if (!isNextJsDevelopment()) return false;
  const v = process.env["BADWR_SCRIPTURE_MODULE_ACCESS_DEBUG"];
  if (v === undefined) return true;
  const t = v.trim().toLowerCase();
  return t !== "0" && t !== "false" && t !== "no";
}

/**
 * Dev-only: shown from scripture layout when access is denied but user passed auth + onboarding.
 * Never render in production (layout gates on NODE_ENV).
 */
export function ScriptureModuleDevAccessDenied({
  email,
  deniedReason,
  debug,
}: {
  email: string | null;
  deniedReason: ScriptureModuleAccessDeniedReason;
  debug: DebugSnapshot;
}) {
  const emailHint = email
    ? `Signed in as ${email}`
    : "Your session has no email on file (unusual for this app).";

  const reasonLine =
    deniedReason === "missing_email"
      ? "Access needs a known email to match the allowlist or use local bypass."
      : "Your email is not on BADWR_SCRIPTURE_MODULE_ADMIN_EMAILS, or that variable is unset / empty.";

  const showDebug = shouldShowAccessDebugPanel();

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Development only
      </p>
      <h1 className="mt-2 font-serif text-2xl font-light text-foreground">Scripture module access</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        The <span className="text-foreground">/scripture</span> route exists, but this preview module is
        hidden unless your account is allowlisted. In production, non-allowlisted users see a generic 404.
      </p>
      <p className="mt-3 text-sm text-foreground">{emailHint}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{reasonLine}</p>

      {showDebug ? (
        <div className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 font-mono text-[11px] leading-relaxed text-foreground">
          <p className="mb-2 font-sans text-xs font-medium text-amber-900 dark:text-amber-100">
            Access debug (dev only; set BADWR_SCRIPTURE_MODULE_ACCESS_DEBUG=0 to hide)
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(debug, null, 2)}
          </pre>
        </div>
      ) : null}

      <div className="mt-8 rounded-xl border border-border bg-muted/30 p-4 text-sm">
        <p className="font-medium text-foreground">Fix locally (pick one)</p>
        <ul className="mt-3 list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            Add your email to{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">
              BADWR_SCRIPTURE_MODULE_ADMIN_EMAILS
            </code>{" "}
            in <code className="rounded bg-muted px-1 py-0.5">.env.local</code> (comma-separated if
            multiple).
          </li>
          <li>
            Or set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">
              BADWR_SCRIPTURE_MODULE_LOCAL_DEV=1
            </code>{" "}
            to skip the allowlist in development only (still requires sign-in).
          </li>
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Restart <code className="rounded bg-muted px-1 py-0.5">npm run dev</code> after changing{" "}
          <code className="rounded bg-muted px-1 py-0.5">.env.local</code> so Next.js reloads env.
        </p>
      </div>

      <p className="mt-8 flex flex-wrap gap-3">
        <Link href="/app" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
          Back to app
        </Link>
        <Link href="/scripture" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Retry after updating env
        </Link>
      </p>
    </div>
  );
}
