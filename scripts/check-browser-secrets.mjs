import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = [
  ".next/static",
  ".next/server/app",
  ".next/standalone/.next/static",
  ".next/standalone/.next/server/app",
].filter(existsSync);

const forbidden = [
  "NEXT_PUBLIC_GORTEX_TOKEN",
  "CF-Access-Client-Id",
  "CF-Access-Client-Secret",
  "CF_ACCESS_CLIENT_ID",
  "CF_ACCESS_CLIENT_SECRET",
  "GORTEX_SERVER_TOKEN",
  "GORTEX_DAEMON_HTTP_TOKEN",
];

const extensions = new Set([
  ".html",
  ".js",
  ".mjs",
  ".json",
  ".txt",
  ".css",
  ".map",
]);

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(path));
    } else if (entry.isFile()) {
      const dot = entry.name.lastIndexOf(".");
      const extension = dot >= 0 ? entry.name.slice(dot) : "";
      if (extensions.has(extension)) {
        files.push(path);
      }
    }
  }

  return files;
}

if (roots.length === 0) {
  throw new Error("No Next.js build output found. Run `npm run build` first.");
}

const findings = [];

for (const root of roots) {
  for (const file of walk(root)) {
    if (statSync(file).size > 10 * 1024 * 1024) {
      continue;
    }

    const text = readFileSync(file, "utf8");
    for (const marker of forbidden) {
      if (text.includes(marker)) {
        findings.push(`${file}: ${marker}`);
      }
    }
  }
}

if (findings.length > 0) {
  console.error("Forbidden browser-delivered credential markers found:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log("No forbidden browser-delivered credential markers found.");
