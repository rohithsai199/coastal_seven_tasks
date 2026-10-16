export const getWebSocketUrl = (path) => {
  const baseUrl =
    import.meta.env.VITE_WS_URL ||
    "ws://127.0.0.1:8000";

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const separator = path.includes("?") ? "&" : "?";
  return token ? `${baseUrl}${path}${separator}token=${encodeURIComponent(token)}` : `${baseUrl}${path}`;
};
