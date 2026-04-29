import { useEffect, useState, useMemo } from "react";
import { api, formatApiError } from "../lib/api";
import { TourCard } from "../components/TourCard";
import { MagnifyingGlass } from "@phosphor-icons/react";

export default function Tours() {
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [q, setQ] = useState("");
    const [difficulty, setDifficulty] = useState("Tümü");

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/tours");
                setTours(data);
            } catch (e) {
                setErr(formatApiError(e));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        return tours.filter((t) => {
            const matchQ =
                !q ||
                t.title.toLowerCase().includes(q.toLowerCase()) ||
                t.location.toLowerCase().includes(q.toLowerCase());
            const matchD = difficulty === "Tümü" || t.difficulty === difficulty;
            return matchQ && matchD;
        });
    }, [tours, q, difficulty]);

    const difficulties = ["Tümü", "Kolay", "Orta", "Zorlu", "Çok Zorlu"];

    return (
        <div data-testid="tours-page" className="pt-32 pb-24 min-h-screen">
            <div className="container-x">
                <div className="max-w-3xl mb-12">
                    <span className="label-eyebrow">Tüm Rotalar</span>
                    <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-forest-900 leading-[1.05]">
                        Anadolu'nun her köşesinden seçtiğimiz <span className="text-terracotta">turlar</span>.
                    </h1>
                    <p className="mt-5 text-base text-forest-900/70 leading-relaxed">
                        Kıyıdan zirveye, antik kentten saklı vadiye — sizi nereye götürelim?
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-10">
                    <div className="relative flex-1">
                        <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-forest/50" />
                        <input
                            data-testid="tours-search-input"
                            type="text"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Tur veya yer ara..."
                            className="w-full pl-11 pr-4 py-3 rounded-full bg-sand-200 border border-sand-300 focus:border-forest focus:outline-none focus:ring-2 focus:ring-terracotta/30 transition-all"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2" data-testid="tours-difficulty-filter">
                        {difficulties.map((d) => (
                            <button
                                key={d}
                                onClick={() => setDifficulty(d)}
                                data-testid={`difficulty-${d}`}
                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                                    difficulty === d
                                        ? "bg-forest text-sand-100 border-forest"
                                        : "bg-transparent border-sand-300 text-forest-900 hover:border-forest"
                                }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                {err && <p className="text-terracotta mb-6">{err}</p>}
                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="aspect-[4/5] rounded-3xl bg-sand-200 animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center" data-testid="tours-empty">
                        <p className="text-forest-900/70 text-lg">Aradığınız kriterlere uygun tur bulunamadı.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filtered.map((t, i) => (
                            <TourCard key={t.id} tour={t} index={i} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
