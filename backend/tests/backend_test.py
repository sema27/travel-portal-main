"""Backend test suite for Yörük Yolu API."""
import os
import uuid
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent.parent.parent / "frontend" / ".env")

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@yorukyolu.com"
ADMIN_PASSWORD = "Yoruk2026!"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def token(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data and "user" in data
    assert data["user"]["email"] == ADMIN_EMAIL
    return data["access_token"]


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------- Health / public ----------
class TestPublic:
    def test_root(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_list_tours_seeded(self, session):
        r = session.get(f"{API}/tours")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 6, f"Expected >=6 seeded tours, got {len(data)}"
        # Validate slug for Turkish title (filter out any TEST_ leftovers)
        kackar = [t for t in data if t["title"].startswith("Kaçkar")]
        assert kackar and kackar[0]["slug"].startswith("kackar-daglari"), f"slug: {kackar[0]['slug'] if kackar else 'none'}"

    def test_featured_tours(self, session):
        r = session.get(f"{API}/tours", params={"featured": "true"})
        assert r.status_code == 200
        for t in r.json():
            assert t["featured"] is True

    def test_get_tour_by_slug(self, session):
        r = session.get(f"{API}/tours")
        slug = r.json()[0]["slug"]
        r2 = session.get(f"{API}/tours/{slug}")
        assert r2.status_code == 200
        assert r2.json()["slug"] == slug

    def test_get_tour_404(self, session):
        r = session.get(f"{API}/tours/non-existent-slug-xyz")
        assert r.status_code == 404

    def test_public_reviews_only_approved(self, session):
        r = session.get(f"{API}/reviews")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 3
        for rev in data:
            assert rev["approved"] is True


# ---------- Auth ----------
class TestAuth:
    def test_login_success(self, session):
        r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert data["token_type"] == "bearer"
        assert data["user"]["role"] == "admin"

    def test_login_invalid(self, session):
        r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_requires_token(self, session):
        r = session.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_with_token(self, session, auth_headers):
        r = session.get(f"{API}/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_admin_routes_unauthenticated(self, session):
        for path in ["/admin/tours", "/admin/reservations", "/admin/reviews", "/admin/contact", "/admin/stats"]:
            # GET admin/tours doesn't exist; use POST for tours, GET for others
            if path == "/admin/tours":
                r = session.post(f"{API}{path}", json={})
            else:
                r = session.get(f"{API}{path}")
            assert r.status_code == 401, f"{path} expected 401 got {r.status_code}"


# ---------- Tours CRUD ----------
class TestTourCRUD:
    created_id = None

    def test_create_tour(self, session, auth_headers):
        payload = {
            "title": f"TESTKackar Özel {uuid.uuid4().hex[:6]}",
            "summary": "Test özet",
            "description": "Test açıklama",
            "places": ["A", "B"],
            "itinerary": ["Gün 1"],
            "image_url": "https://example.com/x.jpg",
            "gallery": [],
            "price": 1000,
            "duration": "2 Gün",
            "location": "Test",
            "difficulty": "Orta",
            "group_size": "5-10",
            "featured": False,
        }
        r = session.post(f"{API}/admin/tours", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        TestTourCRUD.created_id = data["id"]
        TestTourCRUD.created_slug = data["slug"]
        assert data["title"] == payload["title"]
        assert data["slug"].startswith("testkackar-ozel"), f"slug was: {data['slug']}"
        assert "id" in data

    def test_get_created_tour(self, session):
        assert TestTourCRUD.created_id
        r = session.get(f"{API}/tours/{TestTourCRUD.created_slug}")
        assert r.status_code == 200
        assert r.json()["id"] == TestTourCRUD.created_id

    def test_update_tour(self, session, auth_headers):
        r = session.put(
            f"{API}/admin/tours/{TestTourCRUD.created_id}",
            json={"price": 2222, "title": f"TEST_Updated {uuid.uuid4().hex[:6]}"},
            headers=auth_headers,
        )
        assert r.status_code == 200
        assert r.json()["price"] == 2222
        # GET to verify persistence
        r2 = session.get(f"{API}/tours/{r.json()['slug']}")
        assert r2.status_code == 200
        assert r2.json()["price"] == 2222

    def test_delete_tour(self, session, auth_headers):
        r = session.delete(f"{API}/admin/tours/{TestTourCRUD.created_id}", headers=auth_headers)
        assert r.status_code == 200
        # Verify gone
        r2 = session.get(f"{API}/tours/{TestTourCRUD.created_id}")
        assert r2.status_code == 404


# ---------- Reservations ----------
class TestReservations:
    rid = None

    def test_create_reservation_public(self, session):
        payload = {
            "name": "TEST_User",
            "email": "test@example.com",
            "phone": "5551234567",
            "tour_title": "TEST tour",
            "date": "2026-06-15",
            "people": 2,
            "message": "test",
        }
        r = session.post(f"{API}/reservations", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "yeni"
        assert data["name"] == "TEST_User"
        TestReservations.rid = data["id"]

    def test_admin_list_reservations(self, session, auth_headers):
        r = session.get(f"{API}/admin/reservations", headers=auth_headers)
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()]
        assert TestReservations.rid in ids

    def test_update_status(self, session, auth_headers):
        r = session.put(
            f"{API}/admin/reservations/{TestReservations.rid}",
            json={"status": "onaylandı"},
            headers=auth_headers,
        )
        assert r.status_code == 200
        assert r.json()["status"] == "onaylandı"

    def test_delete_reservation(self, session, auth_headers):
        r = session.delete(f"{API}/admin/reservations/{TestReservations.rid}", headers=auth_headers)
        assert r.status_code == 200


# ---------- Reviews ----------
class TestReviews:
    rid = None

    def test_create_review_pending(self, session):
        r = session.post(f"{API}/reviews", json={"name": "TEST_Reviewer", "rating": 4, "comment": "Test"})
        assert r.status_code == 200
        data = r.json()
        assert data["approved"] is False
        TestReviews.rid = data["id"]

    def test_review_not_in_public_until_approved(self, session):
        r = session.get(f"{API}/reviews")
        ids = [x["id"] for x in r.json()]
        assert TestReviews.rid not in ids

    def test_admin_list_all_reviews(self, session, auth_headers):
        r = session.get(f"{API}/admin/reviews", headers=auth_headers)
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()]
        assert TestReviews.rid in ids

    def test_approve_review(self, session, auth_headers):
        r = session.put(
            f"{API}/admin/reviews/{TestReviews.rid}",
            json={"approved": True},
            headers=auth_headers,
        )
        assert r.status_code == 200
        assert r.json()["approved"] is True
        # Now in public list
        r2 = session.get(f"{API}/reviews")
        assert TestReviews.rid in [x["id"] for x in r2.json()]

    def test_delete_review(self, session, auth_headers):
        r = session.delete(f"{API}/admin/reviews/{TestReviews.rid}", headers=auth_headers)
        assert r.status_code == 200


# ---------- Contact ----------
class TestContact:
    cid = None

    def test_create_contact(self, session):
        r = session.post(f"{API}/contact", json={
            "name": "TEST_Contact",
            "email": "tc@example.com",
            "phone": "5550",
            "subject": "TEST_subject",
            "message": "Hello",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["read"] is False
        TestContact.cid = data["id"]

    def test_admin_list_contact(self, session, auth_headers):
        r = session.get(f"{API}/admin/contact", headers=auth_headers)
        assert r.status_code == 200
        assert TestContact.cid in [x["id"] for x in r.json()]

    def test_mark_read(self, session, auth_headers):
        r = session.put(f"{API}/admin/contact/{TestContact.cid}/read", headers=auth_headers)
        assert r.status_code == 200
        # Verify
        r2 = session.get(f"{API}/admin/contact", headers=auth_headers)
        msg = next(x for x in r2.json() if x["id"] == TestContact.cid)
        assert msg["read"] is True

    def test_delete_contact(self, session, auth_headers):
        r = session.delete(f"{API}/admin/contact/{TestContact.cid}", headers=auth_headers)
        assert r.status_code == 200


# ---------- Stats ----------
class TestStats:
    def test_admin_stats(self, session, auth_headers):
        r = session.get(f"{API}/admin/stats", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        for key in ["tours", "reservations_total", "reservations_new", "reviews_pending", "messages_unread"]:
            assert key in data
            assert isinstance(data[key], int)
