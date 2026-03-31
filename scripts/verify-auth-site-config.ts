/**
 * Verifies getPublicSiteBaseUrl() behavior (auth email / invite link base).
 * Run: npx tsx scripts/verify-auth-site-config.ts
 * With local env: dotenv -e .env.local -- npx tsx scripts/verify-auth-site-config.ts
 */
import assert from "node:assert";

const KEYS = ["NEXT_PUBLIC_SITE_URL", "VERCEL_URL"] as const;
const saved: Record<string, string | undefined> = {};

function stashEnv() {
  for (const k of KEYS) saved[k] = process.env[k];
}

function restoreEnv() {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
}

let failed = 0;

async function testCase(
  name: string,
  env: Record<string, string | undefined>,
  expected: string
) {
  try {
    stashEnv();
    for (const k of KEYS) delete process.env[k];
    Object.assign(process.env, env);
    const { getPublicSiteBaseUrl } = await import("../src/lib/public-site-url");
    const got = getPublicSiteBaseUrl();
    assert.strictEqual(got, expected, `expected ${expected}, got ${got}`);
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${e instanceof Error ? e.message : e}`);
  } finally {
    restoreEnv();
  }
}

async function main() {
  console.log("Unit checks: getPublicSiteBaseUrl()\n");

  await testCase(
    "explicit https URL",
    { NEXT_PUBLIC_SITE_URL: "https://www.badwr.app" },
    "https://www.badwr.app"
  );
  await testCase(
    "host only → https",
    { NEXT_PUBLIC_SITE_URL: "www.badwr.app" },
    "https://www.badwr.app"
  );
  await testCase(
    "trailing slash stripped",
    { NEXT_PUBLIC_SITE_URL: "https://www.badwr.app/" },
    "https://www.badwr.app"
  );
  await testCase(
    "VERCEL_URL fallback (no SITE_URL)",
    { VERCEL_URL: "badwr-abc.vercel.app" },
    "https://badwr-abc.vercel.app"
  );
  await testCase(
    "VERCEL_URL with scheme stripped",
    { VERCEL_URL: "https://badwr-abc.vercel.app" },
    "https://badwr-abc.vercel.app"
  );
  await testCase(
    "localhost when neither set",
    {},
    "http://localhost:3000"
  );

  console.log("\nLocal .env preview (this shell only)\n");
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercel = process.env.VERCEL_URL?.trim();
  const supa = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (site) console.log(`  NEXT_PUBLIC_SITE_URL = ${site}`);
  else console.log("  NEXT_PUBLIC_SITE_URL = (not set in this shell)");
  if (vercel) console.log(`  VERCEL_URL = ${vercel}`);
  if (supa) {
    const clean = supa.replace(/\/$/, "");
    const ok = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(clean);
    console.log(
      `  NEXT_PUBLIC_SUPABASE_URL = ${ok ? "OK shape" : "CHECK"} (${clean.slice(0, 48)}…)`
    );
  } else {
    console.log("  NEXT_PUBLIC_SUPABASE_URL = (not set in this shell)");
  }

  if (!site && !vercel) {
    console.log(
      "\n  Tip: dotenv -e .env.local -- npx tsx scripts/verify-auth-site-config.ts"
    );
  }

  if (failed > 0) {
    console.error(`\n${failed} test(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll unit checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
