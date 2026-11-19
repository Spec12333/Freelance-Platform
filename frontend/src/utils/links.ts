// Only regular web URLs can become clickable portfolio/avatar links.
export const getWebUrl = (value: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
};

// Uploaded photos are relative to the API host, which may differ from Vite.
export const getAvatarUrl = (value: string | null) => {
  if (!value) return null;
  if (!/^\/api\/freelancers\/\d+\/avatar(?:\?v=[a-f0-9]{64})?$/.test(value)) return getWebUrl(value);
  try {
    const apiBase = new URL(import.meta.env.VITE_API_URL || "/api", window.location.origin);
    return getWebUrl(new URL(value, apiBase).href);
  } catch {
    return null;
  }
};
