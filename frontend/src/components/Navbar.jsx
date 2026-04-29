import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { List, X } from "@phosphor-icons/react";
import { Logo } from "./Logo";

const links = [
    { to: "/", label: "Ana Sayfa" },
    { to: "/turlar", label: "Turlar" },
    { to: "/hakkimizda", label: "Hakkımızda" },
    { to: "/iletisim", label: "İletişim" },
];

export const Navbar = () => {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        onScroll();
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => setOpen(false), [location.pathname]);

    return (
        <header
            data-testid="main-navbar"
            className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
                scrolled ? "bg-sand-100/85 backdrop-blur-xl border-b border-forest/10" : "bg-transparent"
            }`}
        >
            <div className="container-x flex items-center justify-between h-20">
                <Logo />
                <nav className="hidden md:flex items-center gap-8">
                    {links.map((l) => (
                        <NavLink
                            key={l.to}
                            to={l.to}
                            data-testid={`nav-link-${l.to.replace("/", "") || "home"}`}
                            end={l.to === "/"}
                            className={({ isActive }) =>
                                `text-sm font-medium transition-colors hover:text-terracotta ${
                                    isActive ? "text-terracotta" : "text-forest-900"
                                }`
                            }
                        >
                            {l.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="hidden md:flex items-center gap-3">
                    <Link to="/turlar" data-testid="navbar-cta" className="btn-accent text-sm py-2.5 px-5">
                        Tur Bul
                    </Link>
                </div>
                <button
                    data-testid="mobile-menu-toggle"
                    className="md:hidden p-2 text-forest-900"
                    onClick={() => setOpen((s) => !s)}
                    aria-label="Menü"
                >
                    {open ? <X size={26} /> : <List size={26} />}
                </button>
            </div>
            {open && (
                <div className="md:hidden bg-sand-100 border-t border-forest/10">
                    <div className="container-x py-6 flex flex-col gap-5">
                        {links.map((l) => (
                            <NavLink
                                key={l.to}
                                to={l.to}
                                data-testid={`mobile-nav-link-${l.to.replace("/", "") || "home"}`}
                                end={l.to === "/"}
                                className={({ isActive }) =>
                                    `text-base font-medium ${isActive ? "text-terracotta" : "text-forest-900"}`
                                }
                            >
                                {l.label}
                            </NavLink>
                        ))}
                        <Link to="/turlar" className="btn-accent self-start" data-testid="mobile-navbar-cta">
                            Tur Bul
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
};
