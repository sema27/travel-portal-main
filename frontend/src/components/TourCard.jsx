import { Link } from "react-router-dom";
import { ArrowRight, Clock, MapPin, Mountains } from "@phosphor-icons/react";
import { formatTRY } from "../lib/api";

export const TourCard = ({ tour, index = 0 }) => {
    return (
        <Link
            to={`/turlar/${tour.slug}`}
            data-testid={`tour-card-${tour.slug}`}
            className="group block bg-sand-200 border border-sand-300 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-forest/30"
            style={{ animationDelay: `${index * 80}ms` }}
        >
            <div className="aspect-[4/3] overflow-hidden bg-sand-300">
                <img
                    src={tour.image_url}
                    alt={tour.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            </div>
            <div className="p-6 space-y-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-forest/70">
                    <span className="flex items-center gap-1.5"><MapPin size={14} weight="duotone" /> {tour.location}</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} weight="duotone" /> {tour.duration}</span>
                </div>
                <h3 className="text-2xl font-display font-semibold text-forest-900 leading-tight">{tour.title}</h3>
                <p className="text-forest-900/70 text-sm leading-relaxed line-clamp-2">{tour.summary}</p>
                <div className="flex items-end justify-between pt-3 border-t border-sand-300">
                    <div>
                        <div className="text-[11px] uppercase tracking-[0.2em] text-forest/60">Başlangıç</div>
                        <div className="text-xl font-display font-semibold text-terracotta">{formatTRY(tour.price)}</div>
                    </div>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-forest-900 group-hover:text-terracotta transition-colors">
                        Detayları Gör <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-forest/60 pt-1">
                    <Mountains size={14} weight="duotone" /> Zorluk: {tour.difficulty} • {tour.group_size}
                </div>
            </div>
        </Link>
    );
};
