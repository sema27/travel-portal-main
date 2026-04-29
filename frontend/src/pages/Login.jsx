import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { ShieldCheck, ArrowRight } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { formatApiError } from "../lib/api";
import { Logo } from "../components/Logo";

export default function Login() {
    const { user, login } = useAuth();
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (user) return <Navigate to="/admin" replace />;

    const submit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await login(email, password);
            toast.success("Hoş geldiniz!");
            nav("/admin");
        } catch (er) {
            toast.error("Giriş başarısız", { description: formatApiError(er) });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div data-testid="login-page" className="min-h-screen pt-28 pb-16 flex items-center">
            <div className="container-x grid lg:grid-cols-2 gap-12 items-center w-full">
                <div className="space-y-6">
                    <Logo />
                    <span className="label-eyebrow">Yönetim Paneli</span>
                    <h1 className="text-4xl sm:text-5xl font-display font-bold text-forest-900 leading-[1.05]">
                        Tur ve rezervasyon yönetimine <span className="text-terracotta">tek noktadan</span> erişin.
                    </h1>
                    <p className="text-forest-900/75 leading-relaxed max-w-md">
                        Yeni rota ekleyin, gelen rezervasyonları onaylayın, gezgin yorumlarını yönetin.
                    </p>
                    <div className="flex items-center gap-3 text-sm text-forest/70">
                        <ShieldCheck size={20} weight="duotone" className="text-forest" />
                        Yalnızca yetkili personel erişimine açıktır.
                    </div>
                </div>

                <form onSubmit={submit} data-testid="login-form" className="surface-card p-8 md:p-10 space-y-5 max-w-md w-full ml-auto">
                    <h2 className="text-2xl font-display font-semibold text-forest-900">Giriş Yap</h2>
                    <div>
                        <label className="text-xs uppercase tracking-[0.18em] text-forest/60 block mb-2">E-posta</label>
                        <input data-testid="login-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-sand-100 border border-sand-300 focus:border-forest focus:outline-none focus:ring-2 focus:ring-terracotta/20" />
                    </div>
                    <div>
                        <label className="text-xs uppercase tracking-[0.18em] text-forest/60 block mb-2">Şifre</label>
                        <input data-testid="login-password" required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-sand-100 border border-sand-300 focus:border-forest focus:outline-none focus:ring-2 focus:ring-terracotta/20" />
                    </div>
                    <button data-testid="login-submit" type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                        {submitting ? "Giriş yapılıyor..." : (<>Giriş Yap <ArrowRight size={18} /></>)}
                    </button>
                </form>
            </div>
        </div>
    );
}
