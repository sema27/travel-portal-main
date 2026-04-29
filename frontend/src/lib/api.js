import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
    baseURL: "https://travel-portal-main.onrender.com/api",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("yy_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const formatApiError = (err) => {
    const detail = err?.response?.data?.detail;
    if (!detail) return err?.message || "Bir hata oluştu.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
        return detail.map((e) => (typeof e?.msg === "string" ? e.msg : JSON.stringify(e))).join(" • ");
    }
    if (detail?.msg) return detail.msg;
    return JSON.stringify(detail);
};

export const formatTRY = (n) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(Number(n) || 0);

export const formatDate = (d) =>
    new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
