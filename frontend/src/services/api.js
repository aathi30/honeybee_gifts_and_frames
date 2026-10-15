import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
  timeout: 20000,
});
api.interceptors.request.use(async (config) => {
  if (config.data instanceof FormData) config.timeout = 120000;
  if (["post", "put", "patch", "delete"].includes(config.method)) {
    const { data } = await api.get("/auth/csrf");
    config.headers[data.headerName] = data.token;
  }
  return config;
});
export const errorText = (error) =>
  error.response?.data?.message ||
  (error.code === "ECONNABORTED"
    ? "The request took too long. Please try again."
    : "We could not connect. Please try again in a moment.");
export const fieldErrors = (error) => error.response?.data?.errors || {};
export function multipart(name, data, files = [], fileKey = "images") {
  const body = new FormData();
  body.append(
    name,
    new Blob([JSON.stringify(data)], { type: "application/json" }),
  );
  files.forEach((file) => body.append(fileKey, file));
  return body;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      error.config?.url?.startsWith("/admin/")
    )
      window.dispatchEvent(new Event("honeybee:session-expired"));
    return Promise.reject(error);
  },
);
