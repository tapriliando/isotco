/**
 * Offer to store username + password in the browser / OS password manager.
 * SPAs that call preventDefault() on submit often never trigger the default
 * "save password?" heuristic; PasswordCredential explicitly registers the login.
 *
 * Requires a secure context (HTTPS or localhost). Does not persist credentials in
 * localStorage or app code—the vault is managed by the browser.
 */
export async function storeLoginInBrowserPasswordManager(
  username: string,
  password: string,
): Promise<void> {
  if (typeof window === "undefined" || !window.isSecureContext) return;

  const { PasswordCredential, navigator: nav } = window;
  if (!PasswordCredential || typeof nav?.credentials?.store !== "function") return;

  const id = username.trim();
  if (!id || !password) return;

  try {
    const cred = new PasswordCredential({
      id,
      password,
      name: id,
    });
    await nav.credentials.store(cred);
  } catch {
    /* user dismissed, blocked, or unsupported */
  }
}
