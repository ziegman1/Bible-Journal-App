#!/usr/bin/env node
/**
 * Download a source file from a Vercel deployment (CLI/API upload builds keep a file tree).
 *
 * 1. Create a token: https://vercel.com/account/tokens
 * 2. Pick a deployment id: `npx vercel inspect https://YOUR-deployment-url.vercel.app`
 *    (id looks like dpl_xxxxxxxx)
 * 3. Run from repo root:
 *
 *    VERCEL_TOKEN=xxx node scripts/fetch-vercel-deployment-file.mjs \
 *      --deployment dpl_xxxxxxxx \
 *      --path src/components/dashboard/BadwrPathwayIllustratedMap.tsx \
 *      --out /tmp/BadwrPathwayIllustratedMap.tsx
 *
 * Team id defaults to org in .vercel/project.json (orgId).
 *
 * Git / GitHub deployments: the file tree is usually EMPTY — Vercel does not expose
 * repo source via this API for those builds. Use --info to print the commit SHA, then
 * recover the file from GitHub (or `git show <sha>:path`).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const projectJson = path.join(root, ".vercel", "project.json");

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const verbose = process.argv.includes("--verbose") || process.argv.includes("-v");
const listOnly = process.argv.includes("--list");
const infoOnly = process.argv.includes("--info");
const noTeam = process.argv.includes("--no-team");

const token = process.env.VERCEL_TOKEN;
const deploymentId = arg("--deployment");
const wantPath = arg("--path");
const outPath = arg("--out");

function log(...a) {
  if (verbose) console.error("[vercel-fetch]", ...a);
}

if (!token) {
  console.error("Missing VERCEL_TOKEN. In this same terminal run:");
  console.error('  export VERCEL_TOKEN="your_token"');
  console.error("Then run the node command again (child processes need export, not VAR=value alone).");
  process.exit(1);
}
if (!deploymentId || (!listOnly && !infoOnly && (!wantPath || !outPath))) {
  console.error("Usage:");
  console.error(
    "  VERCEL_TOKEN=... node scripts/fetch-vercel-deployment-file.mjs --deployment dpl_xxx --path src/.../File.tsx --out /tmp/File.tsx",
  );
  console.error("List API file tree (often empty for GitHub-linked deploys):");
  console.error(
    "  VERCEL_TOKEN=... node scripts/fetch-vercel-deployment-file.mjs --deployment dpl_xxx --list",
  );
  console.error("Show deployment + git metadata (use commit to recover from Git):");
  console.error(
    "  VERCEL_TOKEN=... node scripts/fetch-vercel-deployment-file.mjs --deployment dpl_xxx --info",
  );
  console.error("Add --verbose for API details. Use --no-team if list returns [] but deployment exists.");
  process.exit(1);
}

let teamId = process.env.VERCEL_TEAM_ID;
if (!noTeam && !teamId && fs.existsSync(projectJson)) {
  const { orgId } = JSON.parse(fs.readFileSync(projectJson, "utf8"));
  teamId = orgId;
}
if (noTeam) teamId = undefined;

const base = "https://api.vercel.com";

function teamQuery(extra = {}) {
  const params = new URLSearchParams();
  if (teamId) params.set("teamId", teamId);
  for (const [k, v] of Object.entries(extra)) {
    if (v != null && v !== "") params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

async function listFiles() {
  const url = `${base}/v6/deployments/${encodeURIComponent(deploymentId)}/files${teamQuery()}`;
  log("GET", url);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`List files ${res.status}: ${t.slice(0, 800)}`);
  }
  return res.json();
}

async function getDeployment() {
  const url = `${base}/v13/deployments/${encodeURIComponent(deploymentId)}${teamQuery({ withGitRepoInfo: "true" })}`;
  log("GET", url);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Get deployment ${res.status}: ${t.slice(0, 800)}`);
  }
  return res.json();
}

function walk(entries, prefix = "") {
  const out = [];
  for (const e of entries || []) {
    const name = `${prefix}${e.name}`;
    const t = (e.type || "").toLowerCase();
    if (t === "directory" && e.children) {
      out.push(...walk(e.children, `${name}/`));
    } else if (t === "file" && e.uid) {
      out.push({ path: name, uid: e.uid });
    }
  }
  return out;
}

function rootEntries(tree) {
  if (Array.isArray(tree)) return tree;
  if (tree && Array.isArray(tree.files)) return tree.files;
  if (tree && Array.isArray(tree.data)) return tree.data;
  return [];
}

async function fetchFile(uid) {
  const url = `${base}/v8/deployments/${encodeURIComponent(deploymentId)}/files/${encodeURIComponent(uid)}${teamQuery()}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`File ${res.status}: ${t.slice(0, 500)}`);
  }
  return res.json();
}

if (infoOnly) {
  try {
    const dep = await getDeployment();
    const meta = dep.meta && typeof dep.meta === "object" ? dep.meta : {};
    const sha =
      meta.githubCommitSha ||
      meta.gitCommitSha ||
      meta.commit ||
      meta.sha ||
      "";
    console.log(JSON.stringify(
      {
        id: dep.id,
        url: dep.url,
        name: dep.name,
        readyState: dep.readyState,
        target: dep.target,
        meta: dep.meta,
        gitSource: dep.gitSource ?? undefined,
        gitRepo: dep.gitRepo ?? undefined,
      },
      null,
      2,
    ));
    console.error("\n--- Recover source file from Git (if this deploy was from GitHub) ---");
    if (sha) {
      console.error(`Commit SHA: ${sha}`);
      console.error("From your repo root (replace path if needed):");
      console.error(`  git fetch origin ${sha} 2>/dev/null; git show ${sha}:src/components/dashboard/BadwrPathwayIllustratedMap.tsx`);
      console.error("Or open that commit on GitHub and copy the file from the tree.");
    } else {
      console.error("No githubCommitSha (or similar) in meta — check JSON above for repo/branch hints.");
    }
  } catch (e) {
    console.error(String(e.message || e));
    if (teamId) {
      console.error("Tip: retry with --no-team if this deployment is under a personal scope.");
    }
    process.exit(1);
  }
  process.exit(0);
}

let tree;
try {
  tree = await listFiles();
} catch (e) {
  console.error(String(e.message || e));
  if (teamId) {
    console.error("Tip: retry with --no-team if you get 404 / permission errors.");
  }
  process.exit(1);
}

const entries = rootEntries(tree);
log("Tree top-level keys:", tree && typeof tree === "object" && !Array.isArray(tree) ? Object.keys(tree) : "(array)");
log("Root entry count:", entries.length);

const flat = walk(entries);
log("Total file nodes:", flat.length);
if (verbose && flat.length === 0) {
  const raw = typeof tree === "string" ? tree : JSON.stringify(tree);
  log("Raw list response (truncated):", raw.slice(0, 1500));
}

if (listOnly) {
  const lines = flat.map((f) => f.path).sort();
  if (lines.length === 0) {
    console.error(
      "(no paths) — typical for Git-connected deploys; Vercel’s /files tree is only populated for CLI/API uploads.",
    );
    console.error("Use --info to print deployment meta + commit SHA, then recover from GitHub or `git show <sha>:path`.");
    process.exit(2);
  }
  console.log(lines.slice(0, 200).join("\n"));
  if (lines.length > 200) console.error(`\n… and ${lines.length - 200} more (use --verbose)`);
  process.exit(0);
}

const norm = (p) => p.replace(/^\/+/, "");
const target = norm(wantPath);
const hit = flat.find((f) => norm(f.path) === target || norm(f.path).endsWith(target));

if (!hit) {
  console.error("File not found in deployment:", wantPath);
  console.error(`Deployment has ${flat.length} file(s) in API tree.`);
  if (flat.length === 0) {
    console.error(
      "Empty tree is normal for GitHub/Git-linked deployments: Vercel does not expose the repo file tree via GET …/files (only CLI/API uploads with a `files` payload do).",
    );
    console.error("Run: same command with --info to get githubCommitSha, then restore from Git:");
    console.error(`  git show <sha>:${target}`);
  } else {
    console.error("First 40 paths:");
    console.error(flat.slice(0, 40).map((f) => f.path).join("\n"));
  }
  process.exit(1);
}

console.error("Downloading:", hit.path, "→", outPath);
const payload = await fetchFile(hit.uid);
log("File payload keys:", payload && typeof payload === "object" ? Object.keys(payload) : typeof payload);

const b64 = payload?.data ?? payload?.content;
fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
if (typeof b64 === "string") {
  fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
} else if (typeof payload === "string") {
  fs.writeFileSync(outPath, payload, "utf8");
} else {
  console.error("Unexpected API shape:", payload && typeof payload === "object" ? Object.keys(payload) : payload);
  process.exit(1);
}
const bytes = fs.statSync(outPath).size;
console.log("OK — wrote", outPath, `(${bytes} bytes) from`, hit.path);
