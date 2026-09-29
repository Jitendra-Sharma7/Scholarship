/**
 * Runs a Next.js CLI command with PORT loaded from `.env`.
 *
 * `next start` reads `.env` itself, so PORT in that file is enough for it. The
 * dev server does not: it only looks at the process environment, so `npm run
 * dev` silently fell back to 3000 while `npm run start` honoured the same file.
 * That split is why the app and NEXTAUTH_URL could disagree about the origin.
 *
 * Everything else is passed straight through, so `node scripts/with-env.mjs next
 * build` also works and behaves the same way.
 *
 *   node scripts/with-env.mjs next dev
 *   node scripts/with-env.mjs next dev --turbo
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { sep } from "node:path";

import { readEnvFile } from "./lib/secrets.mjs";

const require = createRequire(import.meta.url);
const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/with-env.mjs <command> [...args]");
  process.exit(1);
}

const env = { ...process.env };

for (const [key, value] of readEnvFile()) {
  // The real environment always wins, matching how Next.js layers .env.
  if (env[key] === undefined) env[key] = value;
}

// `next` is a .cmd shim on Windows and cannot be spawned without a shell, which
// makes Node warn about unescaped arguments. Its real entry point
// (dist/bin/next) has no file extension, so it is run under this same Node
// instead of being executed directly. That avoids both the shim and the
// warning, on every platform.
let file = command;
let execArgv = process.execArgv;
try {
  const resolved = require.resolve(`${command}/package.json`);
  if (resolved.includes(`${sep}next${sep}`)) {
    file = process.execPath;
    execArgv = [];
    args.unshift(require.resolve(`${command}/dist/bin/next`));
  }
} catch {
  // Not a package: treat the command as an executable on PATH, as spawn would.
}

const child = spawn(file, args, {
  stdio: "inherit",
  env,
  execArgv,
});

child.on("error", (error) => {
  console.error(`with-env: could not run ${command}: ${error.message}`);
  process.exit(1);
});

// Forward termination so Ctrl-C stops the child rather than orphaning it.
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("close", (code) => process.exit(code ?? 0));
