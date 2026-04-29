import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Compass, ShieldCheck, Users, Star, Quotes } from "@phosphor-icons/react";
import { api, formatApiError } from "../lib/api";
import { TourCard } from "../components/TourCard";

const HERO_IMG =
    "https://images.unsplash.com/photo-1693643449957-80c9c36772d0?crop=entropy&cs=srgb&fm=jpg&q=85";

const VALUES = [
    { icon: Compass, title: "Yerel Rehberler", text: "Her rota, o coğrafyada büyümüş, hikâyelerini bilen rehberlerle planlanır." },
    { icon: ShieldCheck, title: "Güvenli Macera", text: "Profesyonel ekipman, sigorta ve 12 yıllık deneyim ile içiniz rahat olsun." },
    { icon: Users, title: "Küçük Gruplar", text: "Kalabalık değil, samimi gruplarla doğanın sesini duyacak kadar yavaş yürüyoruz." },
];

export default function Home() {
    const [tours, setTours] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [err, setErr] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const [t, r] = await Promise.all([
                    api.get("/tours", { params: { featured: true } }),
                    api.get("/reviews"),
                ]);
                setTours(t.data);
                setReviews(r.data);
            } catch (e) {
                setErr(formatApiError(e));
            }
        })();
    }, []);

    return (
        <div data-testid="home-page">
            {/* HERO */}
            <section className="relative min-h-[100vh] pt-20 overflow-hidden">
                <div className="absolute inset-0">
                    <img src={HERO_IMG} alt="Yörük Yolu macera" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-forest-900/45" />
                    <div className="absolute inset-0 grain opacity-30" />
                </div>
                <div className="relative container-x min-h-[calc(100vh-5rem)] flex flex-col justify-center py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="max-w-3xl"
                    >
                        <span className="label-eyebrow text-sand-100/80">Anadolu Macera Acentası — Est. 2014</span>
                        <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-sand-100 leading-[1.05]">
                            Sis altındaki yaylalara, antik patikalara <span className="text-terracotta">birlikte</span> yürüyelim.
                        </h1>
                        <p className="mt-6 text-lg text-sand-100/85 max-w-2xl leading-relaxed">
                            Kaçkar'ın buzul göllerinden Likya'nın turkuaz koylarına; her tur özenle hazırlanmış bir hikâyedir.
                            Küçük gruplar, yöresel sofralar ve unutulmaz manzaralar.
                        </p>
                        <div className="mt-10 flex flex-wrap gap-4">
                            <Link to="/turlar" data-testid="hero-cta-tours" className="btn-accent">
                                Turları Keşfet <ArrowRight size={18} />
                            </Link>
                            <Link to="/iletisim" data-testid="hero-cta-contact" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium border border-sand-100/40 text-sand-100 hover:bg-sand-100 hover:text-forest-900 transition-all">
                                Bize Ulaş
                            </Link>
                        </div>
                        <div className="mt-14 grid grid-cols-3 max-w-md gap-6 text-sand-100">
                            <div>
                                <div className="text-3xl font-display font-bold">12+</div>
                                <div className="text-xs uppercase tracking-[0.2em] text-sand-100/70">Yıllık Deneyim</div>
                            </div>
                            <div>
                                <div className="text-3xl font-display font-bold">86</div>
                                <div className="text-xs uppercase tracking-[0.2em] text-sand-100/70">Eşsiz Rota</div>
                            </div>
                            <div>
                                <div className="text-3xl font-display font-bold">4.9★</div>
                                <div className="text-xs uppercase tracking-[0.2em] text-sand-100/70">Gezgin Puanı</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FEATURED TOURS */}
            <section className="py-24 md:py-32" id="tours">
                <div className="container-x">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
                        <div className="max-w-2xl">
                            <span className="label-eyebrow">Öne Çıkan Rotalar</span>
                            <h2 className="mt-4 text-4xl sm:text-5xl font-display font-bold text-forest-900 leading-tight">
                                Bu mevsim için seçtiğimiz <span className="text-terracotta">macera</span> başlıkları.
                            </h2>
                        </div>
                        <Link to="/turlar" className="text-forest font-medium inline-flex items-center gap-2 hover:text-terracotta" data-testid="home-all-tours-link">
                            Tüm turları gör <ArrowRight size={18} />
                        </Link>
                    </div>
                    {err && <p className="text-terracotta">{err}</p>}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tours.slice(0, 3).map((t, i) => (
                            <TourCard key={t.id} tour={t} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* VALUES STRIP */}
            <section className="py-20 bg-sand-200 border-y border-sand-300">
                <div className="container-x grid md:grid-cols-3 gap-10">
                    {VALUES.map((v, i) => {
                        const Icon = v.icon;
                        return (
                            <div key={i} data-testid={`value-${i}`} className="space-y-3">
                                <Icon size={36} weight="duotone" className="text-terracotta" />
                                <h3 className="text-xl font-display font-semibold text-forest-900">{v.title}</h3>
                                <p className="text-forest-900/70 leading-relaxed">{v.text}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="py-24 md:py-32">
                <div className="container-x">
                    <div className="max-w-2xl mb-14">
                        <span className="label-eyebrow">Gezgin Yorumları</span>
                        <h2 className="mt-4 text-4xl sm:text-5xl font-display font-bold text-forest-900">
                            Patikadan dönenler ne diyor?
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {reviews.slice(0, 3).map((r, i) => (
                            <div
                                key={r.id}
                                data-testid={`review-${i}`}
                                className="surface-card p-8 space-y-4 hover:-translate-y-1 hover:shadow-lg transition-all"
                            >
                                <Quotes size={28} className="text-terracotta" weight="fill" />
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, k) => (
                                        <Star key={k} size={16} weight={k < r.rating ? "fill" : "regular"} className="text-terracotta" />
                                    ))}
                                </div>
                                <p className="text-forest-900/80 leading-relaxed">"{r.comment}"</p>
                                <div className="pt-3 border-t border-sand-300">
                                    <div className="font-display font-semibold text-forest-900">{r.name}</div>
                                </div>
                            </div>
                        ))}
                        {reviews.length === 0 && (
                            <p className="text-forest/60 col-span-3">Henüz onaylı yorum bulunmuyor.</p>
                        )}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20">
                <div className="container-x">
                    <div className="rounded-3xl bg-forest text-sand-100 p-12 md:p-16 grid md:grid-cols-2 gap-10 items-center overflow-hidden relative">
                        <div className="absolute -right-10 -bottom-10 opacity-10 text-[12rem] leading-none font-display font-bold">YÖRÜK</div>
                        <div className="relative">
                            <span className="text-xs uppercase tracking-[0.25em] text-sand-100/70">Sıradaki Senin Hikâyen</span>
                            <h2 className="mt-3 text-4xl md:text-5xl font-display font-bold leading-tight">Hadi, çantanı topla.</h2>
                            <p className="mt-5 text-sand-100/80 max-w-md leading-relaxed">
                                Bir telefon, bir yıldızlı gece kampı, bir yorgun ama mutlu sabah. Aramıza katıl.
                            </p>
                        </div>
                        <div className="relative flex md:justify-end gap-4 flex-wrap">
                            <Link to="/turlar" className="btn-accent" data-testid="cta-tours">Turları İncele</Link>
                            <Link to="/iletisim" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-sand-100/40 text-sand-100 hover:bg-sand-100 hover:text-forest-900 transition-all" data-testid="cta-contact">
                                Bize Ulaş
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
