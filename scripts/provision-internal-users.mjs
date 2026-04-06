import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const internalDomain = process.env.INTERNAL_AUTH_DOMAIN ?? "internal.local";
const usernamesPath = process.env.USERNAMES_FILE ?? "scripts/usernames.txt";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const absoluteUsernamesPath = path.resolve(process.cwd(), usernamesPath);

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
