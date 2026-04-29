import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Clock, MapPin, Mountains, Users, Star, CheckCircle } from "@phosphor-icons/react";
import { api, formatApiError, formatTRY } from "../lib/api";

export default function TourDetail() {
    const { slug } = useParams();
    const [tour, setTour] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [form, setForm] = useState({ name: "", email: "", phone: "", date: "", people: 2, message: "" });
    const [reviewForm, setReviewForm] = useState({ name: "", rating: 5, comment: "" });
    const [submitting, setSubmitting] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get(`/tours/${slug}`);
                setTour(data);
                const r = await api.get("/reviews", { params: { tour_id: data.id } });
                setReviews(r.data);
            } catch (e) {
                setErr(formatApiError(e));
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    const submitReservation = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post("/reservations", {
                ...form,
                tour_id: tour.id,
                tour_title: tour.title,
                people: Number(form.people) || 1,
            });
            toast.success("Rezervasyon talebiniz alındı!", { description: "En kısa sürede sizinle iletişime geçeceğiz." });
            setForm({ name: "", email: "", phone: "", date: "", people: 2, message: "" });
        } catch (er) {
            toast.error("Talep gönderilemedi", { description: formatApiError(er) });
        } finally {
            setSubmitting(false);
        }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        setSubmittingReview(true);
        try {
            await api.post("/reviews", { ...reviewForm, tour_id: tour.id, rating: Number(reviewForm.rating) });
            toast.success("Yorumunuz alındı!", { description: "Onaylandıktan sonra sitede görünecektir." });
            setReviewForm({ name: "", rating: 5, comment: "" });
        } catch (er) {
            toast.error("Yorum gönderilemedi", { description: formatApiError(er) });
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) return <div className="pt-32 container-x">Yükleniyor...</div>;
    if (err || !tour) return <div className="pt-32 container-x text-terracotta">{err || "Tur bulunamadı"}</div>;

    return (
        <div data-testid="tour-detail-page" className="pt-20 pb-24">
            {/* HERO */}
            <section className="relative h-[70vh] min-h-[480px]">
                <img src={tour.image_url} alt={tour.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-forest-900/40" />
                <div className="relative container-x h-full flex flex-col justify-end pb-16">
                    <Link to="/turlar" className="inline-flex items-center gap-2 text-sand-100 mb-6 text-sm hover:text-terracotta transition-colors" data-testid="back-to-tours">
                        <ArrowLeft size={16} /> Tüm Turlar
                    </Link>
                    <span className="label-eyebrow text-sand-100/80">{tour.location}</span>
                    <h1 data-testid="tour-title" className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-sand-100 leading-[1.05] max-w-4xl">
                        {tour.title}
                    </h1>
                    <p className="mt-4 text-lg text-sand-100/85 max-w-2xl">{tour.summary}</p>
                </div>
            </section>

            {/* INFO STRIP */}
            <section className="bg-sand-200 border-b border-sand-300 py-6">
                <div className="container-x grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                    <div className="flex items-center gap-3"><Clock size={22} weight="duotone" className="text-terracotta" /><div><div className="text-xs uppercase tracking-[0.18em] text-forest/60">Süre</div><div className="font-medium">{tour.duration}</div></div></div>
                    <div className="flex items-center gap-3"><Mountains size={22} weight="duotone" className="text-terracotta" /><div><div className="text-xs uppercase tracking-[0.18em] text-forest/60">Zorluk</div><div className="font-medium">{tour.difficulty}</div></div></div>
                    <div className="flex items-center gap-3"><Users size={22} weight="duotone" className="text-terracotta" /><div><div className="text-xs uppercase tracking-[0.18em] text-forest/60">Grup</div><div className="font-medium">{tour.group_size}</div></div></div>
                    <div className="flex items-center gap-3"><MapPin size={22} weight="duotone" className="text-terracotta" /><div><div className="text-xs uppercase tracking-[0.18em] text-forest/60">Bölge</div><div className="font-medium">{tour.location}</div></div></div>
                </div>
            </section>

            {/* CONTENT */}
            <section className="py-16">
                <div className="container-x grid lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">
                        <div>
                            <span className="label-eyebrow">Tur Hakkında</span>
                            <h2 className="mt-3 text-3xl font-display font-semibold text-forest-900 mb-5">Bu rota size ne sunuyor?</h2>
                            <p className="text-forest-900/80 leading-relaxed text-lg">{tour.description}</p>
                        </div>

                        <div>
                            <span className="label-eyebrow">Gezilecek Yerler</span>
                            <h2 className="mt-3 text-3xl font-display font-semibold text-forest-900 mb-5">Rotadaki duraklar</h2>
                            <div className="flex flex-wrap gap-2">
                                {tour.places.map((p, i) => (
                                    <span key={i} data-testid={`place-${i}`} className="px-4 py-2 rounded-full bg-sand-200 border border-sand-300 text-forest-900 text-sm">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <span className="label-eyebrow">Program</span>
                            <h2 className="mt-3 text-3xl font-display font-semibold text-forest-900 mb-6">Günlük plan</h2>
                            <ol className="space-y-4">
                                {tour.itinerary.map((step, i) => (
                                    <li key={i} data-testid={`itinerary-${i}`} className="flex gap-4 surface-card p-5">
                                        <div className="shrink-0 w-10 h-10 rounded-full bg-terracotta text-sand-100 flex items-center justify-center font-display font-semibold">{i + 1}</div>
                                        <p className="text-forest-900/85 leading-relaxed pt-1">{step}</p>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        {tour.gallery?.length > 0 && (
                            <div>
                                <span className="label-eyebrow">Galeri</span>
                                <h2 className="mt-3 text-3xl font-display font-semibold text-forest-900 mb-5">Patikalardan kareler</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {tour.gallery.map((g, i) => (
                                        <img key={i} src={g} alt="" className="rounded-2xl aspect-[4/3] object-cover w-full" loading="lazy" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* REVIEWS */}
                        <div>
                            <span className="label-eyebrow">Yorumlar</span>
                            <h2 className="mt-3 text-3xl font-display font-semibold text-forest-900 mb-6">Bu turdan dönenler</h2>
                            {reviews.length === 0 ? (
                                <p className="text-forest-900/60">Henüz yorum bulunmuyor. İlk siz yorum yapın!</p>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map((r, i) => (
                                        <div key={r.id} data-testid={`tour-review-${i}`} className="surface-card p-6 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="font-display font-semibold text-forest-900">{r.name}</div>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, k) => (
                                                        <Star key={k} size={14} weight={k < r.rating ? "fill" : "regular"} className="text-terracotta" />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-forest-900/80 leading-relaxed">{r.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* REVIEW FORM */}
                            <form onSubmit={submitReview} data-testid="review-form" className="surface-card p-6 mt-6 space-y-4">
                                <h3 className="font-display font-semibold text-xl text-forest-900">Yorumunuzu paylaşın</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <input data-testid="review-name" required placeholder="Adınız" value={reviewForm.name} onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })} className="px-4 py-3 rounded-xl bg-sand-100 border border-sand-300 focus:border-forest focus:outline-none" />
                                    <select data-testid="review-rating" value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })} className="px-4 py-3 rounded-xl bg-sand-100 border border-sand-300 focus:border-forest focus:outline-none">
                                        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Yıldız</option>)}
                                    </select>
                                </div>
                                <textarea data-testid="review-comment" required placeholder="Deneyiminizi yazın..." rows={3} value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-sand-100 border border-sand-300 focus:border-forest focus:outline-none" />
                                <button data-testid="review-submit" type="submit" disabled={submittingReview} className="btn-primary disabled:opacity-50">
                                    {submittingReview ? "Gönderiliyor..." : "Yorumu Gönder"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* RESERVATION SIDEBAR */}
                    <aside className="lg:sticky lg:top-28 self-start surface-card p-7 space-y-5">
                        <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-forest/60">Kişi başı</div>
                            <div className="text-4xl font-display font-bold text-terracotta">{formatTRY(tour.price)}</div>
                            <p className="text-xs text-forest/60 mt-1">Tüm transferler ve konaklama dahil</p>
                        </div>

                        <form onSubmit={submitReservation} data-testid="reservation-form" className="space-y-3">
                            <input data-testid="res-name" required placeholder="Adınız Soyadınız" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-sand-100 border border-sand-300 focus:border-forest focus:outline-none" />
                            <input data-testid="res-email" required type="email" placeholder="E-posta" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-sand-100 border border-sand-300 focus:border-forest focus:outline-none" />
                            <input data-testid="res-phone" required placeholder="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-sand-100 border border-sand-300 focus:border-forest focus:outline-none" />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest/50 pointer-events-none" />
                                    <input data-testid="res-date" required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full pl-10 pr-3 py-3 rounded-xl bg-sand-100 border border-sand-300 focus:border-forest focus:outline-none" />
                                </div>
                                <input data-testid="res-people" required type="number" min={1} max={20} placeholder="Kişi" value={form.people} onChange={(e) => setForm({ ...form, people: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-sand-100 border border-sand-300 focus:border-forest focus:outline-none" />
                            </div>
                            <textarea data-testid="res-message" placeholder="Notunuz (opsiyonel)" rows={2} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-sand-100 border border-sand-300 focus:border-forest focus:outline-none" />
                            <button data-testid="res-submit" type="submit" disabled={submitting} className="btn-accent w-full disabled:opacity-50">
                                {submitting ? "Gönderiliyor..." : "Rezervasyon Talebi Gönder"}
                            </button>
                        </form>

                        <div className="pt-3 border-t border-sand-300 text-xs text-forest/70 space-y-1.5">
                            <div className="flex items-center gap-2"><CheckCircle size={14} weight="fill" className="text-forest" /> Profesyonel rehberlik</div>
                            <div className="flex items-center gap-2"><CheckCircle size={14} weight="fill" className="text-forest" /> Konaklama ve sigorta</div>
                            <div className="flex items-center gap-2"><CheckCircle size={14} weight="fill" className="text-forest" /> Esnek iptal politikası</div>
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    );
}
