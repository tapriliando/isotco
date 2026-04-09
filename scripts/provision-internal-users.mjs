import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Node does not load .env automatically; mirror Vite-style vars for local runs. */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(projectRoot, ".env"));

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const internalDomain =
  process.env.INTERNAL_AUTH_DOMAIN ??
  process.env.VITE_INTERNAL_AUTH_DOMAIN ??
  "internal.local";
const usernamesPath = process.env.USERNAMES_FILE ?? "scripts/usernames.txt";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  console.error(`Set them in the shell or in ${path.join(projectRoot, ".env")}.`);
  process.exit(1);
}

const absoluteUsernamesPath = path.resolve(projectRoot, usernamesPath);

if (!fs.existsSync(absoluteUsernamesPath)) {
  console.error(`Usernames file not found: ${absoluteUsernamesPath}`);
  process.exit(1);
}

const usernames = fs
  .readFileSync(absoluteUsernamesPath, "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

if (usernames.length === 0) {
  console.error("No usernames found. Add one username per line to your usernames file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const generatePassword = () => crypto.randomBytes(10).toString("hex");

async function createInternalUsers() {
  const accountManifest = [];

  for (const username of usernames) {
    const password = generatePassword();
    const dummyEmail = `${username}@${internalDomain}`;

    const { data, error } = await supabase.auth.admin.createUser({
      email: dummyEmail,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: username,
        login_name: username,
      },
    });

    if (error) {
      console.error(`Error creating ${username}: ${error.message}`);
      continue;
    }

    console.log(`Created user: ${username} (${data.user?.id ?? "unknown id"})`);
    accountManifest.push({ username, password });
  }

  console.table(accountManifest);
  console.log(`Total created: ${accountManifest.length}/${usernames.length}`);
}

createInternalUsers().catch((error) => {
  console.error("Provisioning failed:", error);
  process.exit(1);
});
