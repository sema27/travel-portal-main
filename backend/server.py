from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import copy
import os
import re
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ==================== DB SETUP ====================
class DummyClient:
    def close(self):
        pass


class FakeCursor:
    def __init__(self, items):
        self.items = list(items)

    def sort(self, key, direction):
        reverse = direction == -1
        self.items.sort(key=lambda d: d.get(key), reverse=reverse)
        return self

    async def to_list(self, length):
        return self.items[:length]


class FakeCollection:
    def __init__(self, data=None):
        self.data = list(data or [])

    async def create_index(self, *args, **kwargs):
        return None

    def _match(self, doc, query):
        if not query:
            return True
        if "$or" in query:
            return any(self._match(doc, subq) for subq in query["$or"])
        for key, value in query.items():
            if key == "$or":
                continue
            if doc.get(key) != value:
                return False
        return True

    def find(self, query=None, projection=None):
        query = query or {}
        results = [copy.deepcopy(doc) for doc in self.data if self._match(doc, query)]
        return FakeCursor(results)

    async def find_one(self, query=None, projection=None):
        query = query or {}
        for doc in self.data:
            if self._match(doc, query):
                return copy.deepcopy(doc)
        return None

    async def insert_one(self, doc):
        self.data.append(copy.deepcopy(doc))
        class Result:
            inserted_id = doc.get("id")
        return Result()

    async def update_one(self, query, update):
        for doc in self.data:
            if self._match(doc, query):
                if "$set" in update:
                    doc.update(update["$set"])
                return type("Result", (), {"matched_count": 1, "modified_count": 1})()
        return type("Result", (), {"matched_count": 0, "modified_count": 0})()

    async def delete_one(self, query):
        for i, doc in enumerate(self.data):
            if self._match(doc, query):
                self.data.pop(i)
                return type("Result", (), {"deleted_count": 1})()
        return type("Result", (), {"deleted_count": 0})()

    async def count_documents(self, query=None):
        query = query or {}
        return sum(1 for doc in self.data if self._match(doc, query))


class FakeDB:
    def __init__(self):
        self.users = FakeCollection()
        self.tours = FakeCollection()
        self.reservations = FakeCollection()
        self.reviews = FakeCollection()
        self.contact = FakeCollection()


mongo_url = os.environ.get('MONGO_URL')
if mongo_url:
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'travel_portal')]
else:
    client = DummyClient()
    db = FakeDB()

JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-jwt-secret')
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24h
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@yorukyolu.com').lower()
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Yoruk2026!')


# ==================== APP ====================
app = FastAPI(title="Yörük Yolu API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


# ==================== MODELS ====================
class TourBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    summary: str
    description: str
    places: List[str] = []
    itinerary: List[str] = []
    image_url: str
    gallery: List[str] = []
    price: float
    duration: str
    location: str
    difficulty: str = "Orta"
    group_size: str = "8-12 kişi"
    featured: bool = False


class TourCreate(TourBase):
    pass


class TourUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: Optional[str] = None
    summary: Optional[str] = None
    description: Optional[str] = None
    places: Optional[List[str]] = None
    itinerary: Optional[List[str]] = None
    image_url: Optional[str] = None
    gallery: Optional[List[str]] = None
    price: Optional[float] = None
    duration: Optional[str] = None
    location: Optional[str] = None
    difficulty: Optional[str] = None
    group_size: Optional[str] = None
    featured: Optional[bool] = None


class Tour(TourBase):
    id: str
    slug: str
    created_at: datetime


class ReservationCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    email: EmailStr
    phone: str
    tour_id: Optional[str] = None
    tour_title: Optional[str] = None
    date: str
    people: int = 1
    message: Optional[str] = ""


class Reservation(ReservationCreate):
    id: str
    status: Literal["yeni", "onaylandı", "iptal", "tamamlandı"] = "yeni"
    created_at: datetime


class ReservationStatusUpdate(BaseModel):
    status: Literal["yeni", "onaylandı", "iptal", "tamamlandı"]


class ReviewCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    rating: int = Field(ge=1, le=5)
    comment: str
    tour_id: Optional[str] = None


class Review(ReviewCreate):
    id: str
    approved: bool = False
    created_at: datetime


class ReviewApproval(BaseModel):
    approved: bool


class ContactCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    subject: str
    message: str


class ContactMessage(ContactCreate):
    id: str
    read: bool = False
    created_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ==================== AUTH HELPERS ====================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Kimlik doğrulaması gerekli")
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Geçersiz token tipi")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token süresi doldu")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Geçersiz token")


# ==================== UTILITIES ====================
def slugify(text: str) -> str:
    text = text.lower()
    replacements = {"ı": "i", "ğ": "g", "ü": "u", "ş": "s", "ö": "o", "ç": "c"}
    for k, v in replacements.items():
        text = text.replace(k, v)
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text).strip("-")
    return text or str(uuid.uuid4())[:8]


async def make_unique_slug(title: str, exclude_id: Optional[str] = None) -> str:
    base = slugify(title)
    slug = base
    i = 1
    while True:
        q = {"slug": slug}
        if exclude_id:
            q["id"] = {"$ne": exclude_id}
        existing = await db.tours.find_one(q, {"_id": 0, "id": 1})
        if not existing:
            return slug
        i += 1
        slug = f"{base}-{i}"


# ==================== AUTH ROUTES ====================
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    email = req.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı")
    token = create_access_token(user["id"], user["email"])
    return LoginResponse(
        access_token=token,
        user={"id": user["id"], "email": user["email"], "name": user.get("name", "Admin"), "role": user.get("role", "admin")},
    )


@api_router.get("/auth/me")
async def me(admin=Depends(get_current_admin)):
    return admin


# ==================== PUBLIC TOUR ROUTES ====================
@api_router.get("/tours", response_model=List[Tour])
async def list_tours(featured: Optional[bool] = None, limit: int = 100):
    q = {}
    if featured is not None:
        q["featured"] = featured
    docs = await db.tours.find(q, {"_id": 0}).sort("created_at", -1).to_list(limit)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return docs


@api_router.get("/tours/{slug_or_id}", response_model=Tour)
async def get_tour(slug_or_id: str):
    doc = await db.tours.find_one({"$or": [{"slug": slug_or_id}, {"id": slug_or_id}]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Tur bulunamadı")
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return doc


# ==================== ADMIN TOUR ROUTES ====================
@api_router.post("/admin/tours", response_model=Tour)
async def create_tour(payload: TourCreate, admin=Depends(get_current_admin)):
    tour_id = str(uuid.uuid4())
    slug = await make_unique_slug(payload.title)
    now = datetime.now(timezone.utc)
    doc = payload.model_dump()
    doc.update({"id": tour_id, "slug": slug, "created_at": now.isoformat()})
    await db.tours.insert_one(doc)
    doc.pop("_id", None)
    doc["created_at"] = now
    return doc


@api_router.put("/admin/tours/{tour_id}", response_model=Tour)
async def update_tour(tour_id: str, payload: TourUpdate, admin=Depends(get_current_admin)):
    existing = await db.tours.find_one({"id": tour_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Tur bulunamadı")
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "title" in update and update["title"] != existing["title"]:
        update["slug"] = await make_unique_slug(update["title"], exclude_id=tour_id)
    if update:
        await db.tours.update_one({"id": tour_id}, {"$set": update})
    doc = await db.tours.find_one({"id": tour_id}, {"_id": 0})
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return doc


@api_router.delete("/admin/tours/{tour_id}")
async def delete_tour(tour_id: str, admin=Depends(get_current_admin)):
    res = await db.tours.delete_one({"id": tour_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tur bulunamadı")
    return {"ok": True}


# ==================== RESERVATIONS ====================
@api_router.post("/reservations", response_model=Reservation)
async def create_reservation(payload: ReservationCreate):
    rid = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    doc = payload.model_dump()
    doc.update({"id": rid, "status": "yeni", "created_at": now.isoformat()})
    await db.reservations.insert_one(doc)
    doc.pop("_id", None)
    doc["created_at"] = now
    return doc


@api_router.get("/admin/reservations", response_model=List[Reservation])
async def list_reservations(admin=Depends(get_current_admin)):
    docs = await db.reservations.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return docs


@api_router.put("/admin/reservations/{rid}", response_model=Reservation)
async def update_reservation_status(rid: str, payload: ReservationStatusUpdate, admin=Depends(get_current_admin)):
    res = await db.reservations.update_one({"id": rid}, {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Rezervasyon bulunamadı")
    doc = await db.reservations.find_one({"id": rid}, {"_id": 0})
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return doc


@api_router.delete("/admin/reservations/{rid}")
async def delete_reservation(rid: str, admin=Depends(get_current_admin)):
    res = await db.reservations.delete_one({"id": rid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rezervasyon bulunamadı")
    return {"ok": True}


# ==================== REVIEWS ====================
@api_router.get("/reviews", response_model=List[Review])
async def list_public_reviews(tour_id: Optional[str] = None, limit: int = 50):
    q = {"approved": True}
    if tour_id:
        q["tour_id"] = tour_id
    docs = await db.reviews.find(q, {"_id": 0}).sort("created_at", -1).to_list(limit)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return docs


@api_router.post("/reviews", response_model=Review)
async def create_review(payload: ReviewCreate):
    rid = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    doc = payload.model_dump()
    doc.update({"id": rid, "approved": False, "created_at": now.isoformat()})
    await db.reviews.insert_one(doc)
    doc.pop("_id", None)
    doc["created_at"] = now
    return doc


@api_router.get("/admin/reviews", response_model=List[Review])
async def list_all_reviews(admin=Depends(get_current_admin)):
    docs = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return docs


@api_router.put("/admin/reviews/{rid}", response_model=Review)
async def approve_review(rid: str, payload: ReviewApproval, admin=Depends(get_current_admin)):
    res = await db.reviews.update_one({"id": rid}, {"$set": {"approved": payload.approved}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı")
    doc = await db.reviews.find_one({"id": rid}, {"_id": 0})
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return doc


@api_router.delete("/admin/reviews/{rid}")
async def delete_review(rid: str, admin=Depends(get_current_admin)):
    res = await db.reviews.delete_one({"id": rid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı")
    return {"ok": True}


# ==================== CONTACT MESSAGES ====================
@api_router.post("/contact", response_model=ContactMessage)
async def create_contact(payload: ContactCreate):
    cid = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    doc = payload.model_dump()
    doc.update({"id": cid, "read": False, "created_at": now.isoformat()})
    await db.contact_messages.insert_one(doc)
    doc.pop("_id", None)
    doc["created_at"] = now
    return doc


@api_router.get("/admin/contact", response_model=List[ContactMessage])
async def list_contact(admin=Depends(get_current_admin)):
    docs = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return docs


@api_router.put("/admin/contact/{cid}/read")
async def mark_contact_read(cid: str, admin=Depends(get_current_admin)):
    await db.contact_messages.update_one({"id": cid}, {"$set": {"read": True}})
    return {"ok": True}


@api_router.delete("/admin/contact/{cid}")
async def delete_contact(cid: str, admin=Depends(get_current_admin)):
    res = await db.contact_messages.delete_one({"id": cid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mesaj bulunamadı")
    return {"ok": True}


# ==================== ADMIN STATS ====================
@api_router.get("/admin/stats")
async def admin_stats(admin=Depends(get_current_admin)):
    return {
        "tours": await db.tours.count_documents({}),
        "reservations_total": await db.reservations.count_documents({}),
        "reservations_new": await db.reservations.count_documents({"status": "yeni"}),
        "reviews_pending": await db.reviews.count_documents({"approved": False}),
        "messages_unread": await db.contact_messages.count_documents({"read": False}),
    }


@api_router.get("/")
async def root():
    return {"message": "Yörük Yolu API", "status": "ok"}


# ==================== SEED ====================
SEED_TOURS = [
    {
        "title": "Kaçkar Dağları Yayla Trekkingi",
        "summary": "Karadeniz'in zümrüt yaylalarında 5 günlük yüksek irtifa trekkingi.",
        "description": "Pokut, Sal ve Hazindak yaylalarını birleştiren bu rota, sis altındaki ahşap köyler, buzul gölleri ve geleneksel Hemşin mutfağıyla unutulmaz bir Doğu Karadeniz deneyimi sunuyor. Profesyonel rehber eşliğinde, 1800-3000m arası irtifalarda yürüyoruz.",
        "places": ["Ayder Yaylası", "Pokut Yaylası", "Sal Yaylası", "Hazindak", "Kavrun"],
        "itinerary": [
            "Gün 1: Ayder'e varış, karşılama yemeği ve oryantasyon.",
            "Gün 2: Ayder - Pokut Yaylası yürüyüşü (6 saat).",
            "Gün 3: Pokut - Sal - Hazindak rotası (7 saat).",
            "Gün 4: Kavrun ve buzul gölleri keşfi.",
            "Gün 5: Ayder'e iniş, hamam ve dönüş.",
        ],
        "image_url": "https://images.pexels.com/photos/20227625/pexels-photo-20227625.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "gallery": [
            "https://images.unsplash.com/photo-1664849275192-503e4c864380?crop=entropy&cs=srgb&fm=jpg&q=85",
            "https://images.pexels.com/photos/19333753/pexels-photo-19333753.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        ],
        "price": 14500,
        "duration": "5 Gün 4 Gece",
        "location": "Rize, Türkiye",
        "difficulty": "Zorlu",
        "group_size": "6-10 kişi",
        "featured": True,
    },
    {
        "title": "Likya Yolu Sahil Yürüyüşü",
        "summary": "Antik Likya kalıntıları ile turkuaz koyları birleştiren 4 günlük rota.",
        "description": "Ölüdeniz'den Patara'ya uzanan bu klasik rotada, antik kentler, gizli koylar ve çam ormanları arasında yürüyoruz. Akşamları yöresel taverna ve pansiyonlarda konaklama.",
        "places": ["Ölüdeniz", "Faralya", "Kabak Koyu", "Sidyma", "Patara Antik Kenti"],
        "itinerary": [
            "Gün 1: Ölüdeniz - Faralya (Kelebekler Vadisi durağı).",
            "Gün 2: Faralya - Kabak Koyu yürüyüşü ve plaj molası.",
            "Gün 3: Kabak - Sidyma antik kenti.",
            "Gün 4: Patara'ya iniş, antik kent turu ve veda.",
        ],
        "image_url": "https://images.unsplash.com/photo-1664849275192-503e4c864380?crop=entropy&cs=srgb&fm=jpg&q=85",
        "gallery": [],
        "price": 9800,
        "duration": "4 Gün 3 Gece",
        "location": "Antalya - Muğla",
        "difficulty": "Orta",
        "group_size": "8-14 kişi",
        "featured": True,
    },
    {
        "title": "Kapadokya Vadiler Keşif Turu",
        "summary": "Peri bacaları, yer altı şehirleri ve sıcak hava balonu deneyimi.",
        "description": "Güvercinlik, Ihlara ve Kızılçukur vadilerinde yürüyüş; Derinkuyu yer altı şehri keşfi ve isteğe bağlı balon turu ile büyülü bir Kapadokya tatili.",
        "places": ["Göreme", "Ihlara Vadisi", "Derinkuyu", "Uçhisar", "Kızılçukur"],
        "itinerary": [
            "Gün 1: Göreme - Açık Hava Müzesi ve Kızılçukur gün batımı.",
            "Gün 2: Ihlara Vadisi yürüyüşü ve Selime Katedrali.",
            "Gün 3: Derinkuyu yer altı şehri ve Güvercinlik vadisi.",
        ],
        "image_url": "https://images.pexels.com/photos/19333753/pexels-photo-19333753.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "gallery": [],
        "price": 7200,
        "duration": "3 Gün 2 Gece",
        "location": "Nevşehir",
        "difficulty": "Kolay",
        "group_size": "10-16 kişi",
        "featured": True,
    },
    {
        "title": "Nemrut Dağı Gün Doğumu Macerası",
        "summary": "Antik tanrı heykelleri arasında nefes kesen bir gün doğumu.",
        "description": "Adıyaman'ın ihtişamlı Nemrut Dağı'nda Kommagene Krallığı'nın dev heykelleri eşliğinde gün doğumu; Cendere Köprüsü ve Karakuş Tümülüsü ziyaretleri.",
        "places": ["Nemrut Dağı", "Karakuş Tümülüsü", "Cendere Köprüsü", "Arsemia"],
        "itinerary": [
            "Gün 1: Adıyaman varış, Karakuş ve Cendere köprüsü.",
            "Gün 2: Nemrut zirvesinde gün doğumu, Arsemia ve dönüş.",
        ],
        "image_url": "https://images.unsplash.com/photo-1693643449957-80c9c36772d0?crop=entropy&cs=srgb&fm=jpg&q=85",
        "gallery": [],
        "price": 5400,
        "duration": "2 Gün 1 Gece",
        "location": "Adıyaman",
        "difficulty": "Orta",
        "group_size": "8-12 kişi",
        "featured": False,
    },
    {
        "title": "Karagöl Sazlık Doğa Kampı",
        "summary": "Bolu sınırında yıldız altı kamp ve göl yürüyüşü.",
        "description": "Karagöl çevresinde 2 günlük doğa kampı; akşamları kamp ateşi, sabahları sis altında göl yürüyüşü. Kamp ekipmanları dahildir.",
        "places": ["Karagöl", "Sülüklügöl", "Aladağlar"],
        "itinerary": [
            "Gün 1: Kampa yerleşim, akşam ateşi ve yıldız gözlemi.",
            "Gün 2: Sülüklügöl yürüyüşü ve dönüş.",
        ],
        "image_url": "https://images.unsplash.com/photo-1609373066983-cee8662ea93f?crop=entropy&cs=srgb&fm=jpg&q=85",
        "gallery": [],
        "price": 3400,
        "duration": "2 Gün 1 Gece",
        "location": "Bolu",
        "difficulty": "Kolay",
        "group_size": "10-20 kişi",
        "featured": False,
    },
    {
        "title": "Aladağlar Zirve Tırmanışı",
        "summary": "Demirkazık zirvesine doğru teknik tırmanış deneyimi.",
        "description": "Tecrübeli dağcılar için 4 günlük teknik zirve programı. Yedigöller'den Demirkazık'a (3756m) yükseliş, kamp konaklamaları ve buzul geçişleri.",
        "places": ["Demirkazık", "Yedigöller", "Çımbar Boğazı"],
        "itinerary": [
            "Gün 1: Çukurbağ - Yedigöller kampı.",
            "Gün 2: Akklimatizasyon ve teknik eğitim.",
            "Gün 3: Demirkazık zirve denemesi.",
            "Gün 4: İniş ve dönüş.",
        ],
        "image_url": "https://images.pexels.com/photos/20227625/pexels-photo-20227625.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "gallery": [],
        "price": 18900,
        "duration": "4 Gün 3 Gece",
        "location": "Niğde",
        "difficulty": "Çok Zorlu",
        "group_size": "4-8 kişi",
        "featured": False,
    },
]

SEED_REVIEWS = [
    {"name": "Elif Yıldız", "rating": 5, "comment": "Kaçkar turu hayatımın en güzel deneyimiydi. Rehberimiz harikaydı, organizasyon kusursuzdu.", "approved": True},
    {"name": "Mert Aksoy", "rating": 5, "comment": "Likya Yolu boyunca her detay düşünülmüş. Tekrar tekrar katılırım!", "approved": True},
    {"name": "Selin Demir", "rating": 4, "comment": "Kapadokya turu büyüleyiciydi. Balon sürprizi için ayrıca teşekkürler.", "approved": True},
]


@app.on_event("startup")
async def on_startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.tours.create_index("slug", unique=True)
    await db.tours.create_index("featured")
    await db.reservations.create_index("created_at")
    await db.reviews.create_index("approved")

    # Seed admin
    admin_email = ADMIN_EMAIL
    admin_password = ADMIN_PASSWORD
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Yörük Yolu Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )

    # Seed tours
    if await db.tours.count_documents({}) == 0:
        for t in SEED_TOURS:
            doc = dict(t)
            doc["id"] = str(uuid.uuid4())
            doc["slug"] = await make_unique_slug(doc["title"])
            doc["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.tours.insert_one(doc)

    # Seed reviews
    if await db.reviews.count_documents({}) == 0:
        for r in SEED_REVIEWS:
            doc = dict(r)
            doc["id"] = str(uuid.uuid4())
            doc["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.reviews.insert_one(doc)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# Mount router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
