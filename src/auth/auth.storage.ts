import { getJSON, removeItem, setJSON } from "@/lib/storage";
import type { BackendUser } from "@/types/auth.types";

const KEY = "finanwise.cms.auth.v1";

export type AuthSession = {
  user: BackendUser;
  accessToken: string;
  refreshToken: string;
};

export function saveSession(session: AuthSession) {
  setJSON<AuthSession>(KEY, session);
}

export function loadSession() {
  return getJSON<AuthSession>(KEY);
}

export function clearSession() {
  removeItem(KEY);
}
