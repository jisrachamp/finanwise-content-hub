export const API_BASE_URL = (() => {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (raw ?? "").replace(/\/+$/, "");
})();

export function requireApiBaseUrl() {
  if (!API_BASE_URL) {
    // No reviento en build, pero sí te lo dejo claro en consola
    // (si quieres hacerlo fatal, lanza Error aquí)
    console.warn(
      "[env] Falta VITE_API_BASE_URL. Agrega en .env: VITE_API_BASE_URL=https://tu-api.com"
    );
  }
  return API_BASE_URL;
}
