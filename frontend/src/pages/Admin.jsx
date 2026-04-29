import { useEffect, useState, useCallback } from "react";
import { useNavigate, NavLink, Navigate, Routes, Route } from "react-router-dom";
import { toast } from "sonner";
import {
    SquaresFour,
    MapTrifold,
    Receipt,
    ChatCircleDots,
    Star,
    SignOut,
    Plus,
    PencilSimple,
    Trash,
    Check,
    X,
    EnvelopeOpen,
} from "@phosphor-icons/react";
import { Logo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { api, formatApiError, formatTRY, formatDate } from "../lib/api";

// ========== Layout ==========
function AdminShell({ children }) {
    const { user, logout, loading } = useAuth();
    const nav = useNavigate();
    if (loading) return <div className="pt-32 container-x">Yükleniyor...</div>;
    if (!user) return <Navigate to="/giris" replace />;

    return (
        <div data-testid="admin-page" className="min-h-screen flex">
            <aside className="hidden lg:flex w-64 bg-forest-900 text-sand-100 flex-col fixed inset-y-0 left-0">
                <div className="p-6 border-b border-sand-100/10">
                    <Logo variant="light" />
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {[
                        { to: "/admin", end: true, label: "Genel Bakış", Icon: SquaresFour },
                        { to: "/admin/tours", label: "Turlar", Icon: MapTrifold },
                        { to: "/admin/reservations", label: "Rezervasyonlar", Icon: Receipt },
                        { to: "/admin/reviews", label: "Yorumlar", Icon: Star },
                        { to: "/admin/messages", label: "Mesajlar", Icon: ChatCircleDots },
                    ].map(({ to, end, label, Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            data-testid={`admin-nav-${label}`}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                                    isActive ? "bg-terracotta text-sand-100" : "text-sand-100/70 hover:bg-sand-100/10 hover:text-sand-100"
                                }`
                            }
                        >
                            <Icon size={20} weight="duotone" />
                            {label}
                        </NavLink>
                    ))}
                </nav>
                <div className="p-4 border-t border-sand-100/10">
                    <div className="text-xs uppercase tracking-[0.2em] text-sand-100/50 mb-2">Hesap</div>
                    <div className="text-sm font-medium mb-3 truncate">{user.email}</div>
                    <button
                        data-testid="admin-logout"
                        onClick={() => { logout(); nav("/"); }}
                        className="flex items-center gap-2 text-sm text-sand-100/80 hover:text-terracotta transition-colors"
                    >
                        <SignOut size={18} /> Çıkış Yap
                    </button>
                </div>
            </aside>

            <div className="lg:hidden bg-forest-900 text-sand-100 p-4 fixed top-0 inset-x-0 z-30 flex items-center justify-between">
                <Logo variant="light" />
                <button data-testid="admin-logout-mobile" onClick={() => { logout(); nav("/"); }} className="text-sand-100/80">
                    <SignOut size={22} />
                </button>
            </div>

            <main className="flex-1 lg:ml-64 bg-sand-100 min-h-screen pt-20 lg:pt-0">{children}</main>
        </div>
    );
}

// ========== Overview ==========
function Overview() {
    const [stats, setStats] = useState(null);
    useEffect(() => {
        api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
    }, []);
    const cards = [
        { label: "Toplam Tur", value: stats?.tours ?? "—", k: "tours" },
        { label: "Yeni Rezervasyon", value: stats?.reservations_new ?? "—", k: "res_new" },
        { label: "Toplam Rezervasyon", value: stats?.reservations_total ?? "—", k: "res_total" },
        { label: "Bekleyen Yorum", value: stats?.reviews_pending ?? "—", k: "rev_pending" },
        { label: "Okunmamış Mesaj", value: stats?.messages_unread ?? "—", k: "msg_unread" },
    ];
    return (
        <div className="p-6 lg:p-10 space-y-8">
            <div>
                <span className="label-eyebrow">Yönetim</span>
                <h1 className="mt-2 text-3xl md:text-4xl font-display font-bold text-forest-900">Genel Bakış</h1>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="admin-stats">
                {cards.map((c) => (
                    <div key={c.k} data-testid={`stat-${c.k}`} className="surface-card p-6 bg-sand-200">
                        <div className="text-xs uppercase tracking-[0.2em] text-forest/60">{c.label}</div>
                        <div className="mt-2 text-4xl font-display font-bold text-forest-900">{c.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ========== Tour Modal ==========
const emptyTour = {
    title: "", summary: "", description: "",
    places: "", itinerary: "",
    image_url: "", gallery: "",
    price: 0, duration: "", location: "",
    difficulty: "Orta", group_size: "8-12 kişi", featured: false,
};

function TourModal({ open, onClose, tour, onSaved }) {
    const [form, setForm] = useState(emptyTour);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (tour) {
            setForm({
                ...tour,
                places: (tour.places || []).join("\n"),
                itinerary: (tour.itinerary || []).join("\n"),
                gallery: (tour.gallery || []).join("\n"),
            });
        } else {
            setForm(emptyTour);
        }
    }, [tour, open]);

    if (!open) return null;

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const payload = {
            ...form,
            price: Number(form.price) || 0,
            places: form.places.split("\n").map((s) => s.trim()).filter(Boolean),
            itinerary: form.itinerary.split("\n").map((s) => s.trim()).filter(Boolean),
            gallery: form.gallery.split("\n").map((s) => s.trim()).filter(Boolean),
        };
        try {
            if (tour) {
                await api.put(`/admin/tours/${tour.id}`, payload);
                toast.success("Tur güncellendi");
            } else {
                await api.post("/admin/tours", payload);
                toast.success("Tur eklendi");
            }
            onSaved();
            onClose();
        } catch (er) {
            toast.error("Kaydedilemedi", { description: formatApiError(er) });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-forest-900/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" data-testid="tour-modal">
            <form onSubmit={submit} className="bg-sand-100 rounded-2xl w-full max-w-3xl my-8 border border-sand-300">
                <div className="p-6 border-b border-sand-300 flex items-center justify-between sticky top-0 bg-sand-100 rounded-t-2xl">
                    <h2 className="text-xl font-display font-semibold text-forest-900">{tour ? "Tur Düzenle" : "Yeni Tur Ekle"}</h2>
                    <button type="button" onClick={onClose} className="text-forest-900/60 hover:text-terracotta" data-testid="tour-modal-close"><X size={22} /></button>
                </div>
                <div className="p-6 space-y-4">
                    {[
                        ["title", "Başlık", "input"],
                        ["summary", "Kısa Özet", "input"],
                        ["description", "Açıklama", "textarea"],
                        ["places", "Gezilecek Yerler (her satıra bir tane)", "textarea"],
                        ["itinerary", "Günlük Program (her satıra bir gün)", "textarea"],
                        ["image_url", "Ana Görsel URL", "input"],
                        ["gallery", "Galeri Görselleri (her satıra bir URL)", "textarea"],
                    ].map(([k, label, type]) => (
                        <div key={k}>
                            <label className="text-xs uppercase tracking-[0.18em] text-forest/60 block mb-1.5">{label}</label>
                            {type === "textarea" ? (
                                <textarea data-testid={`tour-form-${k}`} rows={k === "description" ? 4 : 3} required={k === "description" || k === "title" || k === "image_url"} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-sand-200 border border-sand-300 focus:border-forest focus:outline-none" />
                            ) : (
                                <input data-testid={`tour-form-${k}`} required={k === "title" || k === "image_url"} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-sand-200 border border-sand-300 focus:border-forest focus:outline-none" />
                            )}
                        </div>
                    ))}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs uppercase tracking-[0.18em] text-forest/60 block mb-1.5">Fiyat (₺)</label>
                            <input data-testid="tour-form-price" type="number" min={0} required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-sand-200 border border-sand-300 focus:border-forest focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-[0.18em] text-forest/60 block mb-1.5">Süre</label>
                            <input data-testid="tour-form-duration" required value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="3 Gün 2 Gece" className="w-full px-4 py-2.5 rounded-lg bg-sand-200 border border-sand-300 focus:border-forest focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-[0.18em] text-forest/60 block mb-1.5">Konum</label>
                            <input data-testid="tour-form-location" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-sand-200 border border-sand-300 focus:border-forest focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-[0.18em] text-forest/60 block mb-1.5">Zorluk</label>
                            <select data-testid="tour-form-difficulty" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-sand-200 border border-sand-300 focus:border-forest focus:outline-none">
                                {["Kolay", "Orta", "Zorlu", "Çok Zorlu"].map((d) => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-[0.18em] text-forest/60 block mb-1.5">Grup Büyüklüğü</label>
                            <input data-testid="tour-form-group" value={form.group_size} onChange={(e) => setForm({ ...form, group_size: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-sand-200 border border-sand-300 focus:border-forest focus:outline-none" />
                        </div>
                        <label className="flex items-center gap-3 mt-7">
                            <input data-testid="tour-form-featured" type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-5 h-5 accent-terracotta" />
                            <span className="text-forest-900 font-medium">Öne çıkar</span>
                        </label>
                    </div>
                </div>
                <div className="p-6 border-t border-sand-300 flex justify-end gap-3 bg-sand-100 rounded-b-2xl">
                    <button type="button" onClick={onClose} className="btn-outline">İptal</button>
                    <button type="submit" disabled={saving} data-testid="tour-form-submit" className="btn-primary disabled:opacity-50">
                        {saving ? "Kaydediliyor..." : (tour ? "Güncelle" : "Ekle")}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ========== Tours Admin ==========
function ToursAdmin() {
    const [tours, setTours] = useState([]);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const load = useCallback(async () => {
        try {
            const { data } = await api.get("/tours");
            setTours(data);
        } catch (e) {
            toast.error("Yüklenemedi", { description: formatApiError(e) });
        }
    }, []);
    useEffect(() => { load(); }, [load]);

    const remove = async (id) => {
        if (!window.confirm("Bu tur silinsin mi?")) return;
        try {
            await api.delete(`/admin/tours/${id}`);
            toast.success("Tur silindi");
            load();
        } catch (e) {
            toast.error("Silinemedi", { description: formatApiError(e) });
        }
    };

    return (
        <div className="p-6 lg:p-10 space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <span className="label-eyebrow">Yönetim</span>
                    <h1 className="mt-2 text-3xl md:text-4xl font-display font-bold text-forest-900">Turlar</h1>
                </div>
                <button data-testid="add-tour-btn" onClick={() => { setEditing(null); setOpen(true); }} className="btn-accent">
                    <Plus size={18} /> Yeni Tur
                </button>
            </div>

            <div className="surface-card overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-sand-300/60 text-left">
                        <tr>
                            <th className="px-5 py-3 font-medium">Başlık</th>
                            <th className="px-5 py-3 font-medium hidden md:table-cell">Konum</th>
                            <th className="px-5 py-3 font-medium hidden md:table-cell">Süre</th>
                            <th className="px-5 py-3 font-medium">Fiyat</th>
                            <th className="px-5 py-3 font-medium hidden lg:table-cell">Öne Çıkan</th>
                            <th className="px-5 py-3 font-medium text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody data-testid="tours-table-body">
                        {tours.map((t) => (
                            <tr key={t.id} className="border-t border-sand-300">
                                <td className="px-5 py-4 font-medium text-forest-900">{t.title}</td>
                                <td className="px-5 py-4 hidden md:table-cell text-forest-900/70">{t.location}</td>
                                <td className="px-5 py-4 hidden md:table-cell text-forest-900/70">{t.duration}</td>
                                <td className="px-5 py-4 font-medium text-terracotta">{formatTRY(t.price)}</td>
                                <td className="px-5 py-4 hidden lg:table-cell">{t.featured ? <Check size={18} className="text-forest" weight="bold" /> : <X size={18} className="text-forest/40" />}</td>
                                <td className="px-5 py-4">
                                    <div className="flex justify-end gap-2">
                                        <button data-testid={`edit-tour-${t.slug}`} onClick={() => { setEditing(t); setOpen(true); }} className="p-2 rounded-lg hover:bg-sand-300 transition-colors" aria-label="Düzenle">
                                            <PencilSimple size={18} className="text-forest" />
                                        </button>
                                        <button data-testid={`delete-tour-${t.slug}`} onClick={() => remove(t.id)} className="p-2 rounded-lg hover:bg-terracotta/10 transition-colors" aria-label="Sil">
                                            <Trash size={18} className="text-terracotta" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {tours.length === 0 && (
                            <tr><td colSpan="6" className="px-5 py-10 text-center text-forest/60">Henüz tur eklenmemiş.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <TourModal open={open} onClose={() => setOpen(false)} tour={editing} onSaved={load} />
        </div>
    );
}

// ========== Reservations Admin ==========
function ReservationsAdmin() {
    const [items, setItems] = useState([]);

    const load = useCallback(async () => {
        try {
            const { data } = await api.get("/admin/reservations");
            setItems(data);
        } catch (e) { toast.error("Yüklenemedi", { description: formatApiError(e) }); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/admin/reservations/${id}`, { status });
            toast.success("Durum güncellendi");
            load();
        } catch (e) { toast.error("Güncellenemedi", { description: formatApiError(e) }); }
    };

    const remove = async (id) => {
        if (!window.confirm("Rezervasyon silinsin mi?")) return;
        try { await api.delete(`/admin/reservations/${id}`); toast.success("Silindi"); load(); }
        catch (e) { toast.error("Silinemedi", { description: formatApiError(e) }); }
    };

    const statusColor = {
        yeni: "bg-amber-100 text-amber-900 border-amber-200",
        onaylandı: "bg-emerald-100 text-emerald-900 border-emerald-200",
        iptal: "bg-rose-100 text-rose-900 border-rose-200",
        tamamlandı: "bg-sky-100 text-sky-900 border-sky-200",
    };

    return (
        <div className="p-6 lg:p-10 space-y-6">
            <div>
                <span className="label-eyebrow">Yönetim</span>
                <h1 className="mt-2 text-3xl md:text-4xl font-display font-bold text-forest-900">Rezervasyonlar</h1>
            </div>
            <div className="grid gap-4" data-testid="reservations-list">
                {items.map((r) => (
                    <div key={r.id} className="surface-card p-5 grid md:grid-cols-12 gap-4 items-start">
                        <div className="md:col-span-4">
                            <div className="font-display font-semibold text-forest-900">{r.name}</div>
                            <div className="text-sm text-forest-900/70">{r.email}</div>
                            <div className="text-sm text-forest-900/70">{r.phone}</div>
                        </div>
                        <div className="md:col-span-4 text-sm">
                            <div className="text-forest-900 font-medium">{r.tour_title || "—"}</div>
                            <div className="text-forest-900/70">{r.date} • {r.people} kişi</div>
                            {r.message && <p className="text-forest-900/70 mt-1 italic">"{r.message}"</p>}
                        </div>
                        <div className="md:col-span-2 text-xs text-forest-900/60">{formatDate(r.created_at)}</div>
                        <div className="md:col-span-2 flex flex-col gap-2">
                            <select
                                data-testid={`res-status-${r.id}`}
                                value={r.status}
                                onChange={(e) => updateStatus(r.id, e.target.value)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${statusColor[r.status] || ""}`}
                            >
                                {["yeni", "onaylandı", "iptal", "tamamlandı"].map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button data-testid={`res-delete-${r.id}`} onClick={() => remove(r.id)} className="text-xs text-terracotta hover:text-terracotta-700 inline-flex items-center gap-1">
                                <Trash size={14} /> Sil
                            </button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <p className="text-forest/60">Henüz rezervasyon yok.</p>}
            </div>
        </div>
    );
}

// ========== Reviews Admin ==========
function ReviewsAdmin() {
    const [items, setItems] = useState([]);
    const load = useCallback(async () => {
        try { const { data } = await api.get("/admin/reviews"); setItems(data); }
        catch (e) { toast.error("Yüklenemedi", { description: formatApiError(e) }); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const setApproved = async (id, approved) => {
        try { await api.put(`/admin/reviews/${id}`, { approved }); toast.success(approved ? "Onaylandı" : "Onay kaldırıldı"); load(); }
        catch (e) { toast.error("Güncellenemedi", { description: formatApiError(e) }); }
    };
    const remove = async (id) => {
        if (!window.confirm("Yorum silinsin mi?")) return;
        try { await api.delete(`/admin/reviews/${id}`); toast.success("Silindi"); load(); }
        catch (e) { toast.error("Silinemedi", { description: formatApiError(e) }); }
    };

    return (
        <div className="p-6 lg:p-10 space-y-6">
            <div>
                <span className="label-eyebrow">Yönetim</span>
                <h1 className="mt-2 text-3xl md:text-4xl font-display font-bold text-forest-900">Yorumlar</h1>
            </div>
            <div className="grid gap-4" data-testid="reviews-list">
                {items.map((r) => (
                    <div key={r.id} className="surface-card p-5 grid md:grid-cols-12 gap-4 items-start">
                        <div className="md:col-span-3">
                            <div className="font-display font-semibold text-forest-900">{r.name}</div>
                            <div className="flex gap-0.5 mt-1">
                                {[...Array(5)].map((_, k) => <Star key={k} size={14} weight={k < r.rating ? "fill" : "regular"} className="text-terracotta" />)}
                            </div>
                            <div className="text-xs text-forest-900/60 mt-1">{formatDate(r.created_at)}</div>
                        </div>
                        <p className="md:col-span-7 text-forest-900/85 leading-relaxed">{r.comment}</p>
                        <div className="md:col-span-2 flex flex-col gap-2">
                            <button
                                data-testid={`review-approve-${r.id}`}
                                onClick={() => setApproved(r.id, !r.approved)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${r.approved ? "bg-emerald-100 text-emerald-900 border-emerald-200" : "bg-sand-300 text-forest-900 border-sand-300"}`}
                            >
                                {r.approved ? "✓ Onaylı" : "Onayla"}
                            </button>
                            <button data-testid={`review-delete-${r.id}`} onClick={() => remove(r.id)} className="text-xs text-terracotta hover:text-terracotta-700 inline-flex items-center gap-1 self-start">
                                <Trash size={14} /> Sil
                            </button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <p className="text-forest/60">Henüz yorum yok.</p>}
            </div>
        </div>
    );
}

// ========== Messages Admin ==========
function MessagesAdmin() {
    const [items, setItems] = useState([]);
    const load = useCallback(async () => {
        try { const { data } = await api.get("/admin/contact"); setItems(data); }
        catch (e) { toast.error("Yüklenemedi", { description: formatApiError(e) }); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const markRead = async (id) => {
        try { await api.put(`/admin/contact/${id}/read`); load(); } catch {}
    };
    const remove = async (id) => {
        if (!window.confirm("Mesaj silinsin mi?")) return;
        try { await api.delete(`/admin/contact/${id}`); toast.success("Silindi"); load(); }
        catch (e) { toast.error("Silinemedi", { description: formatApiError(e) }); }
    };

    return (
        <div className="p-6 lg:p-10 space-y-6">
            <div>
                <span className="label-eyebrow">Yönetim</span>
                <h1 className="mt-2 text-3xl md:text-4xl font-display font-bold text-forest-900">İletişim Mesajları</h1>
            </div>
            <div className="grid gap-4" data-testid="messages-list">
                {items.map((m) => (
                    <div key={m.id} className={`surface-card p-5 ${!m.read ? "ring-2 ring-terracotta/30" : ""}`}>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                                <div className="font-display font-semibold text-forest-900">{m.name} {!m.read && <span className="ml-2 text-xs bg-terracotta text-sand-100 px-2 py-0.5 rounded-full">Yeni</span>}</div>
                                <div className="text-sm text-forest-900/70">{m.email} {m.phone && `• ${m.phone}`}</div>
                            </div>
                            <div className="text-xs text-forest-900/60">{formatDate(m.created_at)}</div>
                        </div>
                        <div className="mt-3">
                            <div className="text-sm font-medium text-forest-900">Konu: {m.subject}</div>
                            <p className="mt-2 text-forest-900/85 leading-relaxed">{m.message}</p>
                        </div>
                        <div className="mt-4 flex gap-3">
                            {!m.read && (
                                <button data-testid={`msg-read-${m.id}`} onClick={() => markRead(m.id)} className="text-xs text-forest hover:text-forest-700 inline-flex items-center gap-1">
                                    <EnvelopeOpen size={14} /> Okundu olarak işaretle
                                </button>
                            )}
                            <button data-testid={`msg-delete-${m.id}`} onClick={() => remove(m.id)} className="text-xs text-terracotta hover:text-terracotta-700 inline-flex items-center gap-1">
                                <Trash size={14} /> Sil
                            </button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <p className="text-forest/60">Henüz mesaj yok.</p>}
            </div>
        </div>
    );
}

// ========== Main Admin ==========
export default function Admin() {
    return (
        <AdminShell>
            <Routes>
                <Route index element={<Overview />} />
                <Route path="tours" element={<ToursAdmin />} />
                <Route path="reservations" element={<ReservationsAdmin />} />
                <Route path="reviews" element={<ReviewsAdmin />} />
                <Route path="messages" element={<MessagesAdmin />} />
            </Routes>
        </AdminShell>
    );
}
