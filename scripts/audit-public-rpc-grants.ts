import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

const migrationDir = join(process.cwd(), "supabase", "migrations");
const cutoff = "20260906101000";
const allowedAnonExecute = ["app_private.storage_upload_grant_valid"];

function stripComments(sql: string) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--.*$/gm, " ");
}

const violations: string[] = [];

for (const file of readdirSync(migrationDir).filter((name) => name.endsWith(".sql")).sort()) {
  const prefix = basename(file).split("_")[0] ?? "";
  if (prefix < cutoff) continue;

  const sql = stripComments(readFileSync(join(migrationDir, file), "utf8")).toLowerCase();
  const grants = sql.matchAll(/grant\s+execute\s+on\s+function\s+([\s\S]*?)\s+to\s+([^;]+);/g);

  for (const match of grants) {
    const target = match[1]?.replace(/\s+/g, " ").trim() ?? "";
    const grantees = match[2]?.toLowerCase() ?? "";
    if (!/(^|[,\s])(anon|authenticated)([,\s]|$)/.test(grantees)) continue;
    if (allowedAnonExecute.some((allowed) => target.includes(allowed))) continue;
    violations.push(`${file}: anonymous/authenticated EXECUTE grant -> ${target} TO ${grantees.trim()}`);
  }
}

if (violations.length) {
  console.error("RPC privilege regression detected. Browser-facing roles must not receive EXECUTE on RPC functions.");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("RPC privilege audit passed: no unapproved anon/authenticated function EXECUTE grants after v243 cutoff.");
