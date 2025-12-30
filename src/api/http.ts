import { requireApiBaseUrl } from "@/lib/env";
import { loadSession, clearSession } from "@/auth/auth.storage";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type ApiFetchOptions = RequestInit & {
  auth?: boolean; // default true
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const base = requireApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
console.log("API FETCH URL:", url);
  const wantsAuth = options.auth !== false;
  const session = wantsAuth ? loadSession() : null;

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  // Si mandas body y no pusiste content-type, lo ponemos a JSON
  const hasBody = typeof options.body !== "undefined";
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (wantsAuth && session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  // Si tu backend manda 204 o respuestas vacías
  const text = await res.text();
  const data = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    // Si te expira el token y el backend responde 401, limpia sesión
    if (res.status === 401) clearSession();
    throw new ApiError(
      data && typeof data === "object" ? "Request failed" : String(data ?? "Request failed"),
      res.status,
      data
    );
  }

  return data as T;
}

function safeJsonParse(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
