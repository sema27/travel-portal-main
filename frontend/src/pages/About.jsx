export default function About() {
    return (
        <div data-testid="about-page" className="pt-32 pb-24">
            <section className="container-x grid lg:grid-cols-2 gap-16 items-start mb-24">
                <div>
                    <span className="label-eyebrow">Hakkımızda</span>
                    <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-forest-900 leading-[1.05]">
                        12 yıldır Anadolu'nun her köşesinde <span className="text-terracotta">birlikte</span> yürüyoruz.
                    </h1>
                    <p className="mt-6 text-forest-900/80 leading-relaxed text-lg">
                        Yörük Yolu, 2014 yılında üç doğa tutkunu rehberin Kaçkar yamaçlarında verdiği bir sözle başladı: "Bu yolları paylaşalım."
                        Bugün 40 kişilik ekibimizle Türkiye'nin en saklı patikalarına, en sıcak köy sofralarına ve en büyüleyici manzaralarına
                        gezginleri taşıyoruz.
                    </p>
                </div>
                <img
                    src="https://images.unsplash.com/photo-1609373066983-cee8662ea93f?crop=entropy&cs=srgb&fm=jpg&q=85"
                    alt="Yörük Yolu ekibi"
                    className="rounded-3xl aspect-[4/5] object-cover w-full"
                />
            </section>

            <section className="container-x">
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { t: "Yerel Bağlar", d: "Konakladığımız her köyde, masamızı paylaştığımız her ailede yıllar içinde derin bağlar kurduk. Sizi de bu sofralara davet ediyoruz." },
                        { t: "Sürdürülebilirlik", d: "Her tur için karbon dengeleme, mikro-fonlama ve yerel ekonomiyi destekleyen ortaklıklar yapıyoruz." },
                        { t: "Yavaş Yolculuk", d: "Hızlanan dünyanın aksine yavaşlıyoruz. Bir vadiyi anlamak için orada üç gün geçiriyoruz." },
                    ].map((v, i) => (
                        <div key={i} data-testid={`about-value-${i}`} className="surface-card p-8">
                            <div className="text-terracotta text-3xl font-display font-bold mb-3">0{i + 1}</div>
                            <h3 className="text-xl font-display font-semibold text-forest-900 mb-2">{v.t}</h3>
                            <p className="text-forest-900/70 leading-relaxed">{v.d}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
