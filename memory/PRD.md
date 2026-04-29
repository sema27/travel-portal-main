# Yörük Yolu — Tur Acentası Web Sitesi & Admin Paneli

## Original Problem Statement
Tur düzenleyen acenta için tam donanımlı bir web sitesi: turlar ve detayları görünmeli, admin panelinden tur (başlık, gezilecek yerler, içerik, görsel, fiyat) eklenebilmeli, iletişim sayfası bulunmalı. Ek istek: müşteri yorumları + rezervasyon talebi.

## Architecture
- **Backend**: FastAPI + MongoDB + JWT (Bearer) auth, bcrypt password hashing
- **Frontend**: React 19 + Tailwind + shadcn/ui + framer-motion + @phosphor-icons/react
- **Theme**: Earthy "Organic & Earthy" — Warm Sand background, Deep Forest Green primary, Terracotta accent

## What's Implemented (2026-02)
### Public site
- Home (/) — hero, featured tours, value strip, customer reviews, CTA
- Tours grid (/turlar) with search + difficulty filter
- Tour detail (/turlar/:slug) — itinerary, places, gallery, reservation form, public review form
- About (/hakkimizda)
- Contact (/iletisim) form

### Admin
- Login (/giris) — admin@yorukyolu.com / Yoruk2026!
- Dashboard (/admin) — stats overview
- Tours CRUD (modal form: title, summary, description, places, itinerary, image URL, gallery, price, duration, location, difficulty, group size, featured)
- Reservations management (status: yeni, onaylandı, iptal, tamamlandı)
- Reviews moderation (approve / unapprove / delete)
- Contact messages (read/delete)

### Backend endpoints
- Auth: `/api/auth/login`, `/api/auth/me`
- Public: `/api/tours`, `/api/tours/:slug`, `/api/reservations` POST, `/api/reviews` GET/POST, `/api/contact` POST
- Admin (Bearer required): `/api/admin/tours` (POST/PUT/DELETE), `/api/admin/reservations`, `/api/admin/reviews`, `/api/admin/contact`, `/api/admin/stats`

### Seeds (auto-created on first startup)
- Admin user
- 6 demo tours (Kaçkar, Likya Yolu, Kapadokya, Nemrut, Karagöl, Aladağlar)
- 3 approved customer reviews

## Test Results
- 29/29 backend pytest tests passing
- Frontend e2e: all flows verified

## Backlog (P1 / P2)
- P1: Replace native date input with shadcn Calendar/Popover on reservation form
- P1: Star-picker for review rating (instead of native select)
- P1: Image upload (object storage) — currently URL-based
- P2: Email notifications (Resend) for new reservations/messages
- P2: Brute-force lockout (5 attempts / 15 min) on login
- P2: Tour categories/tags, multi-day price tiers, payment integration (Stripe)
- P2: Multi-language (EN) toggle
- P2: Public blog / travel stories
