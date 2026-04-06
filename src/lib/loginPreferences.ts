const REMEMBER_KEY = "isotco_login_remember_username";
const USERNAME_KEY = "isotco_login_saved_username";

export function getRememberUsernamePreference(): boolean {
  try {
    return localStorage.getItem(REMEMBER_KEY) === "1";
  } catch {
    return false;
  }
}

export function getSavedLoginUsername(): string {
  try {
    if (!getRememberUsernamePreference()) return "";
    return localStorage.getItem(USERNAME_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function persistLoginPreferences(remember: boolean, username: string) {
  try {
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, "1");
      localStorage.setItem(USERNAME_KEY, username.trim());
    } else {
      localStorage.removeItem(REMEMBER_KEY);
      localStorage.removeItem(USERNAME_KEY);
    }
  } catch {
    /* private mode / quota */
  }
}
