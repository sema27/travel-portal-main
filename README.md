# 🌄 Yörük Yolu – Travel Portal

Anadolu’nun dört bir yanındaki doğa, trekking ve keşif turlarını sunan full-stack bir web uygulaması.

---

## 🚀 Canlı Demo

* 🌐 Frontend (Vercel): https://travel-portal-main.vercel.app
* ⚙️ Backend (Render): https://travel-portal-main.onrender.com

---

## 🧩 Proje Yapısı

```
travel-portal-main/
│
├── frontend/   → React (UI)
├── backend/    → FastAPI (API)
```

---

## 🛠 Kullanılan Teknolojiler

### Frontend

* React
* Axios
* TailwindCSS

### Backend

* FastAPI
* MongoDB (opsiyonel)
* JWT Authentication
* Uvicorn

### Deployment

* Vercel (Frontend)
* Render (Backend)

---

## ⚙️ Kurulum (Local)

### 1. Projeyi klonla

```bash
git clone https://github.com/sema27/travel-portal-main.git
cd travel-portal-main
```

---

### 2. Frontend başlat

```bash
cd frontend
npm install
npm start
```

👉 http://localhost:3000

---

### 3. Backend başlat

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload
```

👉 http://localhost:10000

---

## 🔗 API Endpointleri

### 🔓 Public

* `GET /api/tours`
* `GET /api/tours/{slug}`
* `POST /api/reservations`
* `GET /api/reviews`
* `POST /api/reviews`
* `POST /api/contact`

### 🔐 Auth

* `POST /api/auth/login`
* `GET /api/auth/me`

### 🛠 Admin (Bearer Token)

* `POST /api/admin/tours`
* `PUT /api/admin/tours/{id}`
* `DELETE /api/admin/tours/{id}`
* `GET /api/admin/reservations`
* `GET /api/admin/reviews`
* `GET /api/admin/contact`
* `GET /api/admin/stats`

---

## 🌍 Deployment

### Frontend (Vercel)

* Root: `frontend`
* Build: otomatik

### Backend (Render)

* Root: `backend`
* Build:

```bash
pip install -r requirements.txt
```

* Start:

```bash
uvicorn server:app --host 0.0.0.0 --port 10000
```

---

## ⚠️ Notlar

* Render free plan nedeniyle ilk istek gecikebilir (sleep mode)
* Backend olmadan frontend veri göstermez
* API URL frontend içinde doğru ayarlanmalıdır

---

## 📌 Özellikler

* Tur listeleme ve filtreleme
* Admin panel (login ile)
* Rezervasyon sistemi
* Yorum sistemi
* RESTful API

---

## ⭐ Katkı

Projeyi beğendiysen ⭐ bırakmayı unutma!

---

<img width="1903" height="940" alt="image" src="https://github.com/user-attachments/assets/773fb19f-6df5-4e9d-8302-c61457bd7a01" />
<img width="1898" height="946" alt="image" src="https://github.com/user-attachments/assets/7d71fc0f-9595-4992-a59f-869a3b8a5d34" />
<img width="1900" height="940" alt="image" src="https://github.com/user-attachments/assets/a7557c89-ac26-4001-b7fb-57a6b6a7a47a" />
<img width="1901" height="912" alt="image" src="https://github.com/user-attachments/assets/7b2c811e-22ba-40eb-ae80-06562353212e" />
<img width="1919" height="937" alt="image" src="https://github.com/user-attachments/assets/669f41d8-c50a-4b7b-a7b6-78ce1aca5fba" />
<img width="1919" height="942" alt="image" src="https://github.com/user-attachments/assets/6ffa42db-69bd-4aea-8b88-5375c6986ebe" />
