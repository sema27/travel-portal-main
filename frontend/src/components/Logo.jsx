import { Link } from "react-router-dom";

export const Logo = ({ variant = "dark" }) => {
    const textColor = variant === "light" ? "text-sand-100" : "text-forest-900";
    const accentColor = variant === "light" ? "text-sand-100" : "text-forest";
    return (
        <Link to="/" data-testid="logo-link" className="flex items-center gap-2.5 group">
            <svg
                className={`${accentColor} transition-transform group-hover:rotate-6`}
                width="34"
                height="34"
                viewBox="0 0 40 40"
                fill="none"
                aria-hidden
            >
                <path d="M3 32 L14 14 L20 22 L26 12 L37 32 Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" fill="none" />
                <circle cx="29" cy="9" r="2.6" fill="currentColor" />
                <path d="M3 32 L37 32" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <div className="leading-none">
                <div className={`font-display font-bold text-xl tracking-tight ${textColor}`}>Yörük Yolu</div>
                <div className={`text-[10px] uppercase tracking-[0.25em] ${variant === "light" ? "text-sand-100/70" : "text-forest/60"}`}>
                    Anadolu Macera Acentası
                </div>
            </div>
        </Link>
    );
};
