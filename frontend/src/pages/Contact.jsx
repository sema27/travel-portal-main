import { useState } from "react";
import { toast } from "sonner";
import { EnvelopeSimple, Phone, MapPin, Clock } from "@phosphor-icons/react";
import { api, formatApiError } from "../lib/api";

export default function Contact() {
    const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
    const [submitting, setSubmitting] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post("/contact", form);
            toast.success("Mesajınız alındı!", { description: "En kısa sürede dönüş yapacağız." });
            setForm({ name: "", email: "", phone: "", subject: "", message: "" });
        } catch (er) {
            toast.error("Mesaj gönderilemedi", { description: formatApiError(er) });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div data-testid="contact-page" className="pt-32 pb-24">
            <div className="container-x grid lg:grid-cols-5 gap-12">
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <span className="label-eyebrow">İletişim</span>
                        <h1 className="mt-4 text-4xl sm:text-5xl font-display font-bold text-forest-900 leading-[1.05]">
                            Bir sonraki maceran için <span className="text-terracotta">hadi konuşalım</span>.
                        </h1>
                        <p className="mt-5 text-forest-900/75 leading-relaxed">
                            Sorularınız, özel grup talepleriniz veya rota önerileriniz için ekibimiz hazır.
                            Genelde 24 saat içinde dönüş yapıyoruz.
                        </p>
                    </div>
                    <ul className="space-y-5">
                        <li className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-full bg-sand-200 border border-sand-300 flex items-center justify-center text-terracotta">
                                <MapPin size={22} weight="duotone" />
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-[0.2em] text-forest/60">Adres</div>
                                <div className="font-medium text-forest-900">Cihangir Mah. Sıraselviler Cad. No:42</div>
                                <div className="text-forest-900/70">Beyoğlu / İstanbul</div>
                            </div>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-full bg-sand-200 border border-sand-300 flex items-center justify-center text-terracotta">
                                <Phone size={22} weight="duotone" />
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-[0.2em] text-forest/60">Telefon</div>
                                <a href="tel:+902129990000" className="font-medium text-forest-900 hover:text-terracotta">+90 (212) 999 00 00</a>
                            </div>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-full bg-sand-200 border border-sand-300 flex items-center justify-center text-terracotta">
                                <EnvelopeSimple size={22} weight="duotone" />
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-[0.2em] text-forest/60">E-posta</div>
                                <a href="mailto:merhaba@yorukyolu.com" className="font-medium text-forest-900 hover:text-terracotta">merhaba@yorukyolu.com</a>
                            </div>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-full bg-sand-200 border border-sand-300 flex items-center justify-center text-terracotta">
                                <Clock size={22} weight="duotone" />
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-[0.2em] text-forest/60">Çalışma Saatleri</div>
                                <div className="font-medium text-forest-900">Pzt-Cmt: 09:00 - 18:30</div>
                            </div>
                        </li>
                    </ul>
                </div>

                <form onSubmit={submit} data-testid="contact-form" className="lg:col-span-3 surface-card p-8 md:p-10 space-y-5">
                    <h2 className="text-2xl font-display font-semibold text-forest-900">Bize yazın</h2>
                    <div className="grid md:grid-cols-2 gap-5">
                        <div>
                            <label className="text-xs uppercase tracking-[0.18em] text-forest/60 block mb-2">İsim Soyisim</label>
                            <input data-testid="contact-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-sand-100 border border-sand-300 focus:border-forest focus:outline-none focus:ring-2 focus:ring-terracotta/20" />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-[0.18em] text-forest/60 block mb-2">E-posta</label>
                            <input data-testid="contact-email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-sand-100 border border-sand-300 focus:border-forest focus:outline-none focus:ring-2 focus:ring-terracotta/20" />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-[0.18em] text-forest/60 block mb-2">Telefon</label>
                            <input data-testid="contact-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-sand-100 border border-sand-300 focus:border-forest focus:outline-none focus:ring-2 focus:ring-terracotta/20" />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-[0.18em] text-forest/60 block mb-2">Konu</label>
                            <input data-testid="contact-subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-sand-100 border border-sand-300 focus:border-forest focus:outline-none focus:ring-2 focus:ring-terracotta/20" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs uppercase tracking-[0.18em] text-forest/60 block mb-2">Mesajınız</label>
                        <textarea data-testid="contact-message" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-sand-100 border border-sand-300 focus:border-forest focus:outline-none focus:ring-2 focus:ring-terracotta/20" />
                    </div>
                    <button data-testid="contact-submit" type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
                        {submitting ? "Gönderiliyor..." : "Mesajı Gönder"}
                    </button>
                </form>
            </div>
        </div>
    );
}
