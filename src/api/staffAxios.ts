import axios from "axios";

const staffApi = axios.create({
  baseURL: import.meta.env.VITE_STAFF_API_URL || "http://localhost:3001",
  timeout: 15000,
});

staffApi.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("ACCESS_TOKEN") ||
    "";

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default staffApi;
