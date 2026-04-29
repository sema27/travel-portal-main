import { Link } from "react-router-dom";
import { InstagramLogo, FacebookLogo, YoutubeLogo, EnvelopeSimple, Phone, MapPin } from "@phosphor-icons/react";
import { Logo } from "./Logo";

export const Footer = () => {
    return (
        <footer data-testid="site-footer" className="bg-forest text-sand-100 mt-32">
            <div className="container-x py-20 md:py-24 grid md:grid-cols-12 gap-12">
                <div className="md:col-span-5 space-y-6">
                    <Logo variant="light" />
                    <p className="text-sand-100/70 max-w-md leading-relaxed">
                        Anadolu'nun vahşi yamaçlarında, gizli koylarında ve antik patikalarında 12 yıldır rehberlik ediyoruz.
                        Her tur, yerel hikâyelerle ve yöresel sofralarla zenginleşir.
                    </p>
                    <div className="flex gap-4 pt-2">
                        <a href="#" data-testid="footer-instagram" aria-label="Instagram" className="hover:text-terracotta transition-colors">
                            <InstagramLogo size={26} weight="duotone" />
                        </a>
                        <a href="#" data-testid="footer-facebook" aria-label="Facebook" className="hover:text-terracotta transition-colors">
                            <FacebookLogo size={26} weight="duotone" />
                        </a>
                        <a href="#" data-testid="footer-youtube" aria-label="YouTube" className="hover:text-terracotta transition-colors">
                            <YoutubeLogo size={26} weight="duotone" />
                        </a>
                    </div>
                </div>
                <div className="md:col-span-3 space-y-4">
                    <div className="text-xs uppercase tracking-[0.25em] text-sand-100/50">Keşfet</div>
                    <ul className="space-y-3">
                        <li><Link to="/turlar" className="hover:text-terracotta transition-colors">Tüm Turlar</Link></li>
                        <li><Link to="/hakkimizda" className="hover:text-terracotta transition-colors">Hakkımızda</Link></li>
                        <li><Link to="/iletisim" className="hover:text-terracotta transition-colors">İletişim</Link></li>
                        <li><Link to="/giris" className="hover:text-terracotta transition-colors">Yönetim</Link></li>
                    </ul>
                </div>
                <div className="md:col-span-4 space-y-4">
                    <div className="text-xs uppercase tracking-[0.25em] text-sand-100/50">İletişim</div>
                    <ul className="space-y-3 text-sand-100/80">
                        <li className="flex items-start gap-3">
                            <MapPin size={20} weight="duotone" className="shrink-0 mt-0.5" />
                            <span>Cihangir Mah. Sıraselviler Cad. No:42, Beyoğlu / İstanbul</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Phone size={20} weight="duotone" />
                            <a href="tel:+902129990000" className="hover:text-terracotta transition-colors">+90 (212) 999 00 00</a>
                        </li>
                        <li className="flex items-center gap-3">
                            <EnvelopeSimple size={20} weight="duotone" />
                            <a href="mailto:merhaba@yorukyolu.com" className="hover:text-terracotta transition-colors">merhaba@yorukyolu.com</a>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-sand-100/15">
                <div className="container-x py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-sand-100/60">
                    <p>© {new Date().getFullYear()} Yörük Yolu Seyahat. Tüm hakları saklıdır.</p>
                    <p>TÜRSAB A-2849 • IATA Onaylı</p>
                </div>
            </div>
        </footer>
    );
};
