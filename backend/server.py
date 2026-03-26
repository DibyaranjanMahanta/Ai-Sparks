from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import base64
import json
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
from openai import OpenAI

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
client_ai = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


# Cloudflare Workers AI setup
CF_ACCOUNT_ID = os.environ.get("CF_ACCOUNT_ID", "")
CF_API_TOKEN = os.environ.get("CF_API_TOKEN", "")

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── i18n Translations ───
TRANSLATIONS = {
    "en": {
        "welcome": "Welcome", "dashboard": "Dashboard", "tracks": "Learning Tracks",
        "quiz": "Quiz", "art_studio": "AI Art Studio", "profile": "Profile",
        "leaderboard": "Leaderboard", "badges": "Badges", "settings": "Settings",
        "get_started": "Get Started", "login": "Log In", "register": "Create Account",
        "logout": "Log Out", "lessons": "Lessons", "complete": "Mark as Complete",
        "next_lesson": "Next Lesson", "track_complete": "Track Complete!",
        "xp_earned": "XP Earned", "back_dashboard": "Back to Dashboard",
        "streak": "Day Streak", "certificates": "Certificates", "olympiad": "AI Olympiad",
        "teacher_dash": "Teacher Dashboard", "parent_dash": "Parent Dashboard",
        "my_students": "My Students", "my_child": "My Child's Progress",
        "language": "Language", "total_xp": "Total XP", "level": "Level",
        "completed": "Completed", "in_progress": "In Progress",
        "congratulations": "Congratulations!", "certificate_earned": "You earned a certificate!",
        "competition": "Competition", "join_olympiad": "Join Olympiad",
        "time_remaining": "Time Remaining", "submit": "Submit",
    },
    "hi": {
        "welcome": "स्वागत", "dashboard": "डैशबोर्ड", "tracks": "सीखने के ट्रैक",
        "quiz": "प्रश्नोत्तरी", "art_studio": "AI कला स्टूडियो", "profile": "प्रोफ़ाइल",
        "leaderboard": "लीडरबोर्ड", "badges": "बैज", "settings": "सेटिंग्स",
        "get_started": "शुरू करें", "login": "लॉग इन", "register": "खाता बनाएं",
        "logout": "लॉग आउट", "lessons": "पाठ", "complete": "पूर्ण करें",
        "next_lesson": "अगला पाठ", "track_complete": "ट्रैक पूर्ण!",
        "xp_earned": "XP अर्जित", "back_dashboard": "डैशबोर्ड पर वापस",
        "streak": "दिन की स्ट्रीक", "certificates": "प्रमाणपत्र", "olympiad": "AI ओलंपियाड",
        "teacher_dash": "शिक्षक डैशबोर्ड", "parent_dash": "अभिभावक डैशबोर्ड",
        "my_students": "मेरे छात्र", "my_child": "मेरे बच्चे की प्रगति",
        "language": "भाषा", "total_xp": "कुल XP", "level": "स्तर",
        "completed": "पूर्ण", "in_progress": "चल रहा",
        "congratulations": "बधाई हो!", "certificate_earned": "आपने प्रमाणपत्र अर्जित किया!",
        "competition": "प्रतियोगिता", "join_olympiad": "ओलंपियाड में शामिल हों",
        "time_remaining": "शेष समय", "submit": "जमा करें",
    },
    "od": {
        "welcome": "ସ୍ୱାଗତ", "dashboard": "ଡ୍ୟାସବୋର୍ଡ", "tracks": "ଶିକ୍ଷଣ ଟ୍ରାକ",
        "quiz": "କ୍ୱିଜ", "art_studio": "AI କଳା ଷ୍ଟୁଡିଓ", "profile": "ପ୍ରୋଫାଇଲ",
        "leaderboard": "ଲିଡରବୋର୍ଡ", "badges": "ବ୍ୟାଜ", "settings": "ସେଟିଂସ",
        "get_started": "ଆରମ୍ଭ କରନ୍ତୁ", "login": "ଲଗ ଇନ", "register": "ଆକାଉଣ୍ଟ ତିଆରି",
        "logout": "ଲଗ ଆଉଟ", "lessons": "ପାଠ", "complete": "ସମ୍ପୂର୍ଣ୍ଣ କରନ୍ତୁ",
        "next_lesson": "ପରବର୍ତ୍ତୀ ପାଠ", "track_complete": "ଟ୍ରାକ ସମ୍ପୂର୍ଣ୍ଣ!",
        "xp_earned": "XP ଅର୍ଜିତ", "back_dashboard": "ଡ୍ୟାସବୋର୍ଡକୁ ଫେରନ୍ତୁ",
        "streak": "ଦିନ ଷ୍ଟ୍ରିକ", "certificates": "ପ୍ରମାଣପତ୍ର", "olympiad": "AI ଓଲମ୍ପିଆଡ",
        "teacher_dash": "ଶିକ୍ଷକ ଡ୍ୟାସବୋର୍ଡ", "parent_dash": "ଅଭିଭାବକ ଡ୍ୟାସବୋର୍ଡ",
        "my_students": "ମୋ ଛାତ୍ର", "my_child": "ମୋ ପିଲାର ପ୍ରଗତି",
        "language": "ଭାଷା", "total_xp": "ମୋଟ XP", "level": "ସ୍ତର",
        "completed": "ସମ୍ପୂର୍ଣ୍ଣ", "in_progress": "ଚାଲୁ ଅଛି",
        "congratulations": "ଅଭିନନ୍ଦନ!", "certificate_earned": "ଆପଣ ପ୍ରମାଣପତ୍ର ପାଇଲେ!",
        "competition": "ପ୍ରତିଯୋଗିତା", "join_olympiad": "ଓଲମ୍ପିଆଡରେ ଯୋଗ ଦିଅନ୍ତୁ",
        "time_remaining": "ବାକି ସମୟ", "submit": "ଦାଖଲ କରନ୍ତୁ",
    },
    "ta": {
        "welcome": "வரவேற்பு", "dashboard": "டாஷ்போர்டு", "tracks": "கற்றல் பாதைகள்",
        "quiz": "வினாடி வினா", "art_studio": "AI கலை ஸ்டுடியோ", "profile": "சுயவிவரம்",
        "leaderboard": "தரவரிசை", "badges": "பேட்ஜ்கள்", "settings": "அமைப்புகள்",
        "get_started": "தொடங்கு", "login": "உள்நுழை", "register": "கணக்கை உருவாக்கு",
        "logout": "வெளியேறு", "lessons": "பாடங்கள்", "complete": "முடிக்கவும்",
        "next_lesson": "அடுத்த பாடம்", "track_complete": "பாதை முடிந்தது!",
        "xp_earned": "XP பெற்றது", "back_dashboard": "டாஷ்போர்டுக்கு திரும்பு",
        "streak": "நாள் தொடர்", "certificates": "சான்றிதழ்கள்", "olympiad": "AI ஒலிம்பியாட்",
        "teacher_dash": "ஆசிரியர் டாஷ்போர்டு", "parent_dash": "பெற்றோர் டாஷ்போர்டு",
        "my_students": "என் மாணவர்கள்", "my_child": "என் குழந்தையின் முன்னேற்றம்",
        "language": "மொழி", "total_xp": "மொத்த XP", "level": "நிலை",
        "completed": "முடிந்தது", "in_progress": "நடந்து கொண்டிருக்கிறது",
        "congratulations": "வாழ்த்துக்கள்!", "certificate_earned": "நீங்கள் சான்றிதழ் பெற்றீர்கள்!",
        "competition": "போட்டி", "join_olympiad": "ஒலிம்பியாட்டில் சேரவும்",
        "time_remaining": "மீதமுள்ள நேரம்", "submit": "சமர்ப்பி",
    },
}

# ─── Pydantic Models ───

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = "student"
    grade_level: str = "high_school"
    language: str = "en"
    parent_email: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    grade_level: str
    xp: int = 0
    level: int = 1
    badges: List[str] = []
    avatar: str = ""
    language: str = "en"
    current_streak: int = 0
    longest_streak: int = 0
    created_at: Optional[str] = None

class TrackOut(BaseModel):
    track_id: str
    title: str
    description: str
    icon: str
    color: str
    lesson_count: int
    difficulty: str
    grade_levels: List[str]

class LessonOut(BaseModel):
    lesson_id: str
    track_id: str
    title: str
    description: str
    content: str
    order: int
    duration_minutes: int
    xp_reward: int
    lesson_type: str

class QuizRequest(BaseModel):
    track_id: str
    difficulty: str = "medium"
    num_questions: int = 5

class QuizAnswer(BaseModel):
    quiz_id: str
    answers: List[int]

class ArtRequest(BaseModel):
    prompt: str

class LessonCompleteRequest(BaseModel):
    lesson_id: str

class LanguageUpdate(BaseModel):
    language: str

class OlympiadJoinRequest(BaseModel):
    competition_id: str

class OlympiadSubmitRequest(BaseModel):
    competition_id: str
    answers: List[int]

class LinkChildRequest(BaseModel):
    child_email: str

# ─── Helpers ───

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_jwt(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if session:
        expires_at = session.get("expires_at")
        if isinstance(expires_at, datetime):
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at < datetime.now(timezone.utc):
                raise HTTPException(status_code=401, detail="Session expired")
        user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
        if user:
            return user
        raise HTTPException(status_code=401, detail="User not found")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500]

def calc_level(xp: int) -> int:
    for i in range(len(LEVEL_THRESHOLDS) - 1, -1, -1):
        if xp >= LEVEL_THRESHOLDS[i]:
            return i + 1
    return 1

BADGE_DEFS = {
    "first_login": {"name": "First Login", "icon": "star", "description": "Welcome to AI Sparks Junior!"},
    "first_lesson": {"name": "First Lesson", "icon": "book-open-variant", "description": "Completed your first lesson"},
    "quiz_master": {"name": "Quiz Master", "icon": "brain", "description": "Scored 80%+ on a quiz"},
    "prompt_master": {"name": "Prompt Master", "icon": "lightbulb-on", "description": "Created AI art in the studio"},
    "five_lessons": {"name": "Knowledge Seeker", "icon": "school", "description": "Completed 5 lessons"},
    "streak_3": {"name": "On Fire!", "icon": "fire", "description": "3-day learning streak"},
    "streak_7": {"name": "Week Warrior", "icon": "calendar-check", "description": "7-day learning streak"},
    "ai_ethics": {"name": "Ethics Champion", "icon": "shield-check", "description": "Completed the Responsible AI track"},
    "data_detective": {"name": "Data Detective", "icon": "magnify", "description": "Explored data bias lessons"},
    "level_5": {"name": "AI Innovator", "icon": "rocket-launch", "description": "Reached Level 5"},
    "track_complete": {"name": "Track Finisher", "icon": "flag-checkered", "description": "Completed an entire track"},
    "certified": {"name": "Certified AI Learner", "icon": "certificate", "description": "Earned a course certificate"},
    "olympiad_participant": {"name": "Olympiad Competitor", "icon": "trophy-variant", "description": "Participated in AI Olympiad"},
    "olympiad_winner": {"name": "Olympiad Champion", "icon": "crown", "description": "Won an AI Olympiad competition"},
}

async def award_badge(user_id: str, badge_key: str):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if user and badge_key not in user.get("badges", []):
        await db.users.update_one({"user_id": user_id}, {"$push": {"badges": badge_key}})

async def add_xp(user_id: str, amount: int):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if user:
        new_xp = user.get("xp", 0) + amount
        new_level = calc_level(new_xp)
        await db.users.update_one({"user_id": user_id}, {"$set": {"xp": new_xp, "level": new_level}})
        if new_level >= 5:
            await award_badge(user_id, "level_5")

async def record_daily_activity(user_id: str):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    existing = await db.daily_activity.find_one({"user_id": user_id, "date": today}, {"_id": 0})
    if not existing:
        await db.daily_activity.insert_one({
            "user_id": user_id,
            "date": today,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    await update_streak(user_id)

async def update_streak(user_id: str):
    activities = await db.daily_activity.find(
        {"user_id": user_id}, {"_id": 0, "date": 1}
    ).sort("date", -1).to_list(365)

    dates = sorted([a["date"] for a in activities], reverse=True)
    if not dates:
        return

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    current_streak = 0
    check_date = today

    for d in dates:
        if d == check_date:
            current_streak += 1
            prev = datetime.strptime(check_date, "%Y-%m-%d") - timedelta(days=1)
            check_date = prev.strftime("%Y-%m-%d")
        elif d < check_date:
            break

    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    longest = max(user.get("longest_streak", 0), current_streak)
    await db.users.update_one({"user_id": user_id}, {
        "$set": {"current_streak": current_streak, "longest_streak": longest}
    })

    if current_streak >= 3:
        await award_badge(user_id, "streak_3")
    if current_streak >= 7:
        await award_badge(user_id, "streak_7")

# ─── AUTH Routes ───

@api_router.post("/auth/register")
async def register(data: UserRegister, response: Response):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "name": data.name,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "role": data.role,
        "grade_level": data.grade_level,
        "language": data.language,
        "xp": 0,
        "level": 1,
        "badges": ["first_login"],
        "avatar": "",
        "current_streak": 0,
        "longest_streak": 0,
        "parent_email": data.parent_email or "",
        "linked_children": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_jwt(user_id, data.role)
    is_production = os.environ.get("ENVIRONMENT", "development") == "production"
    response.set_cookie("session_token", token, httponly=True, secure=is_production,
                        samesite="lax" if not is_production else "none", path="/", max_age=7*86400)
    safe = {k: v for k, v in user_doc.items() if k not in ("password_hash", "_id", "linked_children", "parent_email")}
    return {"token": token, "user": safe}

@api_router.post("/auth/login")
async def login(data: UserLogin, response: Response):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_jwt(user["user_id"], user["role"])
    is_production = os.environ.get("ENVIRONMENT", "development") == "production"
    response.set_cookie("session_token", token, httponly=True, secure=is_production,
                        samesite="lax" if not is_production else "none", path="/", max_age=7*86400)
    safe = {k: v for k, v in user.items() if k not in ("password_hash", "_id", "linked_children", "parent_email")}
    return {"token": token, "user": safe}

@api_router.post("/auth/google")
async def google_auth(request: Request, response: Response):
    body = await request.json()
    id_token_value = body.get("id_token")
    code = body.get("code")

    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "")

    google_data = {}

    async with httpx.AsyncClient() as http_client:
        if id_token_value:
            resp = await http_client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token_value}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google id_token")
            google_data = resp.json()
            if GOOGLE_CLIENT_ID and google_data.get("aud") != GOOGLE_CLIENT_ID:
                raise HTTPException(status_code=401, detail="Token audience mismatch")

        elif code:
            if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
                raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set")
            token_resp = await http_client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uri": REDIRECT_URI,
                    "grant_type": "authorization_code",
                }
            )
            if token_resp.status_code != 200:
                raise HTTPException(status_code=401, detail=f"Google token exchange failed: {token_resp.text}")
            token_data = token_resp.json()

            verify_resp = await http_client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": token_data.get("id_token", "")}
            )
            if verify_resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Could not verify Google token after code exchange")
            google_data = verify_resp.json()

        else:
            raise HTTPException(status_code=400, detail="Provide either 'id_token' or 'code'")

    email = google_data.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="No email returned from Google")

    name = google_data.get("name") or google_data.get("given_name") or email.split("@")[0]
    picture = google_data.get("picture", "")

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": name, "avatar": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "name": name, "email": email,
            "role": "student", "grade_level": "high_school", "language": "en",
            "xp": 0, "level": 1, "badges": ["first_login"], "avatar": picture,
            "current_streak": 0, "longest_streak": 0, "parent_email": "", "linked_children": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    token = create_jwt(user_id, user["role"])
    is_production = os.environ.get("ENVIRONMENT", "development") == "production"
    response.set_cookie(
        "session_token", token, httponly=True, secure=is_production,
        samesite="lax" if not is_production else "none", path="/", max_age=7*86400
    )
    safe = {k: v for k, v in user.items() if k not in ("password_hash", "_id", "linked_children", "parent_email")}
    return {"token": token, "user": safe}

@api_router.get("/auth/session")
async def process_session(session_id: str):
    raise HTTPException(status_code=410, detail="Emergent session endpoint removed. Use POST /api/auth/google.")

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {k: v for k, v in user.items() if k not in ("password_hash", "linked_children", "parent_email")}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

# ─── LANGUAGE ───

@api_router.get("/translations/{lang}")
async def get_translations(lang: str):
    return TRANSLATIONS.get(lang, TRANSLATIONS["en"])

@api_router.put("/user/language")
async def update_language(data: LanguageUpdate, user: dict = Depends(get_current_user)):
    if data.language not in TRANSLATIONS:
        raise HTTPException(status_code=400, detail="Unsupported language")
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"language": data.language}})
    return {"message": "Language updated", "language": data.language}

# ─── TRACKS & LESSONS ───

@api_router.get("/tracks")
async def get_tracks(user: dict = Depends(get_current_user)):
    return await db.tracks.find({}, {"_id": 0}).to_list(100)

@api_router.get("/tracks/{track_id}/lessons")
async def get_lessons(track_id: str, user: dict = Depends(get_current_user)):
    return await db.lessons.find({"track_id": track_id}, {"_id": 0}).sort("order", 1).to_list(100)

@api_router.get("/lessons/{lesson_id}")
async def get_lesson(lesson_id: str, user: dict = Depends(get_current_user)):
    lesson = await db.lessons.find_one({"lesson_id": lesson_id}, {"_id": 0})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@api_router.post("/lessons/complete")
async def complete_lesson(data: LessonCompleteRequest, user: dict = Depends(get_current_user)):
    lesson = await db.lessons.find_one({"lesson_id": data.lesson_id}, {"_id": 0})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    already = await db.progress.find_one({"user_id": user["user_id"], "lesson_id": data.lesson_id}, {"_id": 0})
    xp = 0
    if not already:
        await db.progress.insert_one({
            "user_id": user["user_id"],
            "lesson_id": data.lesson_id,
            "track_id": lesson["track_id"],
            "completed_at": datetime.now(timezone.utc).isoformat()
        })
        xp = lesson.get("xp_reward", 20)
        await add_xp(user["user_id"], xp)
        await record_daily_activity(user["user_id"])

        count = await db.progress.count_documents({"user_id": user["user_id"]})
        if count == 1:
            await award_badge(user["user_id"], "first_lesson")
        if count >= 5:
            await award_badge(user["user_id"], "five_lessons")

    all_lessons = await db.lessons.find(
        {"track_id": lesson["track_id"]}, {"_id": 0}
    ).sort("order", 1).to_list(100)

    current_order = lesson["order"]
    next_lesson = None
    for l in all_lessons:
        if l["order"] > current_order:
            next_lesson = {"lesson_id": l["lesson_id"], "title": l["title"], "order": l["order"]}
            break

    track_completed = False
    track_xp_total = 0
    if not next_lesson:
        completed_in_track = await db.progress.count_documents({
            "user_id": user["user_id"], "track_id": lesson["track_id"]
        })
        if completed_in_track >= len(all_lessons):
            track_completed = True
            track_xp_total = sum(l.get("xp_reward", 0) for l in all_lessons)
            await award_badge(user["user_id"], "track_complete")
            if lesson["track_id"] == "track_ethics":
                await award_badge(user["user_id"], "ai_ethics")
            existing_cert = await db.certificates.find_one({
                "user_id": user["user_id"], "track_id": lesson["track_id"]
            }, {"_id": 0})
            if not existing_cert:
                track_info = await db.tracks.find_one({"track_id": lesson["track_id"]}, {"_id": 0})
                await db.certificates.insert_one({
                    "cert_id": f"cert_{uuid.uuid4().hex[:10]}",
                    "user_id": user["user_id"],
                    "user_name": user["name"],
                    "track_id": lesson["track_id"],
                    "track_title": track_info["title"] if track_info else lesson["track_id"],
                    "total_xp": track_xp_total,
                    "lessons_completed": len(all_lessons),
                    "issued_at": datetime.now(timezone.utc).isoformat()
                })
                await award_badge(user["user_id"], "certified")

    return {
        "message": "Lesson completed!" if xp > 0 else "Already completed",
        "xp_earned": xp,
        "next_lesson": next_lesson,
        "track_completed": track_completed,
        "track_xp_total": track_xp_total,
        "track_id": lesson["track_id"]
    }

@api_router.get("/progress")
async def get_progress(user: dict = Depends(get_current_user)):
    completed = await db.progress.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    quiz_results = await db.quiz_results.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(1000)
    return {"completed_lessons": completed, "quiz_results": quiz_results}

# ─── AI QUIZ ───

FALLBACK_QUESTIONS = [
    {"question": "What does AI stand for?", "options": ["Artificial Intelligence", "Automated Input", "Advanced Internet", "Applied Innovation"], "correct_index": 0, "explanation": "AI stands for Artificial Intelligence."},
    {"question": "Which is an example of AI?", "options": ["A calculator", "A voice assistant like Alexa", "A simple clock", "A notebook"], "correct_index": 1, "explanation": "Voice assistants use AI to understand speech."},
    {"question": "What is Machine Learning?", "options": ["A type of exercise", "Teaching computers to learn from data", "A programming language", "A type of robot"], "correct_index": 1, "explanation": "Machine Learning teaches computers to learn patterns from data."},
    {"question": "Which Indian company is known for AI research?", "options": ["Infosys", "Amul", "Haldiram", "Bata"], "correct_index": 0, "explanation": "Infosys has significant AI research."},
    {"question": "What is a chatbot?", "options": ["A physical robot", "An AI program that can converse", "A type of video game", "A social media app"], "correct_index": 1, "explanation": "A chatbot is an AI program designed to simulate conversation."},
]

@api_router.post("/quiz/generate")
async def generate_quiz(data: QuizRequest, user: dict = Depends(get_current_user)):
    track = await db.tracks.find_one({"track_id": data.track_id}, {"_id": 0})
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    num_q = min(max(data.num_questions, 1), 10)
    grade = user.get("grade_level", "high_school")
    age_context = "11-13 year old middle school" if grade == "middle_school" else "14-18 year old high school"

    prompt = f"""Generate a quiz with exactly {num_q} multiple-choice questions about "{track['title']}" for {age_context} Indian students.
Difficulty: {data.difficulty}

Return ONLY valid JSON (no markdown, no explanation):
{{
  "questions": [
    {{
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Brief explanation"
    }}
  ]
}}"""

    quiz_data = {"questions": FALLBACK_QUESTIONS[:num_q]}
    try:
        if client_ai:
            response = client_ai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an AI education quiz generator for Indian school students. Always return valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
            )
            content = response.choices[0].message.content.strip()
            if content.startswith("```"):
                content = content.split("\n", 1)[1] if "\n" in content else content[3:]
            if content.endswith("```"):
                content = content[:-3]
            if content.startswith("json"):
                content = content[4:]
            quiz_data = json.loads(content.strip())
    except Exception as e:
        logger.error(f"Quiz generation error: {e}")

    quiz_id = f"quiz_{uuid.uuid4().hex[:10]}"
    await db.quizzes.insert_one({
        "quiz_id": quiz_id,
        "track_id": data.track_id,
        "user_id": user["user_id"],
        "questions": quiz_data["questions"],
        "difficulty": data.difficulty,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await record_daily_activity(user["user_id"])
    return {"quiz_id": quiz_id, "questions": quiz_data["questions"]}

@api_router.post("/quiz/submit")
async def submit_quiz(data: QuizAnswer, user: dict = Depends(get_current_user)):
    quiz = await db.quizzes.find_one({"quiz_id": data.quiz_id}, {"_id": 0})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = quiz["questions"]
    correct = 0
    total = len(questions)
    results = []
    for i, q in enumerate(questions):
        user_ans = data.answers[i] if i < len(data.answers) else -1
        is_correct = user_ans == q["correct_index"]
        if is_correct:
            correct += 1
        results.append({
            "question": q["question"], "user_answer": user_ans,
            "correct_answer": q["correct_index"], "is_correct": is_correct,
            "explanation": q.get("explanation", "")
        })

    score = round((correct / total) * 100) if total > 0 else 0
    xp = correct * 10
    await db.quiz_results.insert_one({
        "quiz_result_id": f"qr_{uuid.uuid4().hex[:10]}",
        "quiz_id": data.quiz_id, "user_id": user["user_id"],
        "track_id": quiz["track_id"], "score": score,
        "correct": correct, "total": total, "xp_earned": xp,
        "completed_at": datetime.now(timezone.utc).isoformat()
    })
    await add_xp(user["user_id"], xp)
    if score >= 80:
        await award_badge(user["user_id"], "quiz_master")
    return {"score": score, "correct": correct, "total": total, "xp_earned": xp, "results": results}

# ─── AI ART STUDIO ───

@api_router.post("/art/generate")
async def generate_art(data: ArtRequest, user: dict = Depends(get_current_user)):
    try:
        if not CF_ACCOUNT_ID or not CF_API_TOKEN:
            raise Exception("CF_ACCOUNT_ID and CF_API_TOKEN not set in backend .env")

        full_prompt = (
            f"Create a vibrant, colorful, educational illustration for Indian school students: "
            f"{data.prompt}. Style: age-appropriate, cheerful, detailed artwork."
        )

        cf_url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0"
        headers = {
            "Authorization": f"Bearer {CF_API_TOKEN}",
            "Content-Type": "application/json"
        }
        payload_cf = {"prompt": full_prompt}

        async with httpx.AsyncClient(timeout=120.0) as http_client:
            resp = await http_client.post(cf_url, headers=headers, json=payload_cf)
            if resp.status_code != 200:
                raise Exception(f"Cloudflare AI error {resp.status_code}: {resp.text[:300]}")
            # Cloudflare returns raw PNG bytes
            image_base64 = base64.b64encode(resp.content).decode("utf-8")

        await db.art_gallery.insert_one({
            "art_id": f"art_{uuid.uuid4().hex[:10]}",
            "user_id": user["user_id"],
            "prompt": data.prompt,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        await award_badge(user["user_id"], "prompt_master")
        await add_xp(user["user_id"], 15)
        await record_daily_activity(user["user_id"])

        return {"image_base64": image_base64, "xp_earned": 15}

    except Exception as e:
        logger.error(f"Art generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─── LEADERBOARD ───

@api_router.get("/leaderboard")
async def get_leaderboard(user: dict = Depends(get_current_user)):
    top_users = await db.users.find(
        {"role": "student"},
        {"_id": 0, "user_id": 1, "name": 1, "xp": 1, "level": 1, "avatar": 1, "current_streak": 1}
    ).sort("xp", -1).to_list(50)
    return {"leaderboard": top_users}

# ─── BADGES ───

@api_router.get("/badges")
async def get_badges(user: dict = Depends(get_current_user)):
    user_badges = user.get("badges", [])
    all_badges = []
    for key, info in BADGE_DEFS.items():
        all_badges.append({
            "badge_id": key, "name": info["name"], "icon": info["icon"],
            "description": info["description"], "earned": key in user_badges
        })
    return {"badges": all_badges}

# ─── CERTIFICATES ───

@api_router.get("/certificates")
async def get_certificates(user: dict = Depends(get_current_user)):
    certs = await db.certificates.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    return {"certificates": certs}

# ─── STREAK ───

@api_router.get("/streak")
async def get_streak(user: dict = Depends(get_current_user)):
    activities = await db.daily_activity.find(
        {"user_id": user["user_id"]}, {"_id": 0, "date": 1}
    ).sort("date", -1).to_list(30)
    dates = [a["date"] for a in activities]
    return {
        "current_streak": user.get("current_streak", 0),
        "longest_streak": user.get("longest_streak", 0),
        "recent_dates": dates[:7]
    }

# ─── OLYMPIAD ───

@api_router.get("/olympiad/competitions")
async def get_competitions(user: dict = Depends(get_current_user)):
    comps = await db.competitions.find({}, {"_id": 0}).sort("start_date", -1).to_list(20)
    for comp in comps:
        entry = await db.olympiad_entries.find_one({
            "user_id": user["user_id"], "competition_id": comp["competition_id"]
        }, {"_id": 0})
        comp["participated"] = entry is not None
        comp["score"] = entry.get("score", 0) if entry else 0
    return {"competitions": comps}

@api_router.post("/olympiad/join")
async def join_olympiad(data: OlympiadJoinRequest, user: dict = Depends(get_current_user)):
    comp = await db.competitions.find_one({"competition_id": data.competition_id}, {"_id": 0})
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")

    existing = await db.olympiad_entries.find_one({
        "user_id": user["user_id"], "competition_id": data.competition_id
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already participated")

    prompt = f"""Generate a challenging olympiad quiz with exactly 10 multiple-choice questions about "{comp['title']}" for Indian high school students.
These should be harder than regular quizzes.

Return ONLY valid JSON:
{{
  "questions": [
    {{
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "Explanation"
    }}
  ]
}}"""

    # Default fallback questions
    quiz_data = {
        "questions": [
            {"question": "What is the Turing Test?", "options": ["A test for computer speed", "A test to determine if a machine can exhibit intelligent behavior", "A programming language test", "A hardware test"], "correct_index": 1, "explanation": "The Turing Test evaluates whether a machine can imitate human conversation."},
            {"question": "Which algorithm is used in search engines?", "options": ["Bubble Sort", "PageRank", "Binary Search", "Linear Regression"], "correct_index": 1, "explanation": "PageRank is Google's algorithm for ranking web pages."},
            {"question": "What does NLP stand for in AI?", "options": ["Neural Language Protocol", "Natural Language Processing", "Network Layer Protocol", "Numeric Logic Programming"], "correct_index": 1, "explanation": "NLP is Natural Language Processing - teaching computers to understand human language."},
            {"question": "What is a neural network inspired by?", "options": ["Computer circuits", "The human brain", "Solar panels", "DNA structures"], "correct_index": 1, "explanation": "Neural networks are inspired by the structure of the human brain."},
            {"question": "Which of these is a supervised learning task?", "options": ["Clustering emails", "Spam detection", "Finding anomalies", "Grouping customers"], "correct_index": 1, "explanation": "Spam detection uses labeled data (spam/not spam) making it supervised learning."},
            {"question": "What is overfitting in ML?", "options": ["Model is too simple", "Model memorizes training data but fails on new data", "Model trains too slowly", "Model uses too little data"], "correct_index": 1, "explanation": "Overfitting happens when a model learns training data too well and doesn't generalize."},
            {"question": "Which country leads in AI patents?", "options": ["USA", "China", "India", "Japan"], "correct_index": 1, "explanation": "China leads in AI patent filings globally."},
            {"question": "What is reinforcement learning?", "options": ["Learning from labeled data", "Learning by trial and error with rewards", "Learning from unlabeled data", "Learning from teacher feedback only"], "correct_index": 1, "explanation": "Reinforcement learning uses rewards and penalties to train agents."},
            {"question": "What does GPU stand for?", "options": ["General Processing Unit", "Graphics Processing Unit", "Global Processing Utility", "Graphical Program Unit"], "correct_index": 1, "explanation": "GPU stands for Graphics Processing Unit, widely used for AI training."},
            {"question": "What is a Large Language Model (LLM)?", "options": ["A very long book", "An AI trained on massive text data to understand and generate language", "A database of languages", "A translation software"], "correct_index": 1, "explanation": "LLMs like GPT are trained on huge amounts of text to understand language."},
        ]
    }

    try:
        if client_ai:
            response = client_ai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an AI education quiz generator creating challenging olympiad-level questions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            clean = response.choices[0].message.content.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
            if clean.endswith("```"):
                clean = clean[:-3]
            if clean.startswith("json"):
                clean = clean[4:]
            quiz_data = json.loads(clean.strip())
    except Exception as e:
        logger.error(f"Olympiad quiz error: {e}")

    entry_id = f"entry_{uuid.uuid4().hex[:10]}"
    await db.olympiad_entries.insert_one({
        "entry_id": entry_id,
        "user_id": user["user_id"],
        "competition_id": data.competition_id,
        "questions": quiz_data["questions"],
        "started_at": datetime.now(timezone.utc).isoformat(),
        "submitted": False
    })
    await award_badge(user["user_id"], "olympiad_participant")

    return {
        "entry_id": entry_id,
        "questions": quiz_data["questions"],
        "time_limit_minutes": comp.get("time_limit", 15)
    }

@api_router.post("/olympiad/submit")
async def submit_olympiad(data: OlympiadSubmitRequest, user: dict = Depends(get_current_user)):
    entry = await db.olympiad_entries.find_one({
        "user_id": user["user_id"], "competition_id": data.competition_id, "submitted": False
    }, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="No active entry found")

    questions = entry["questions"]
    correct = sum(1 for i, q in enumerate(questions) if i < len(data.answers) and data.answers[i] == q["correct_index"])
    score = round((correct / len(questions)) * 100)
    xp = correct * 15

    await db.olympiad_entries.update_one(
        {"entry_id": entry["entry_id"]},
        {"$set": {"submitted": True, "score": score, "correct": correct, "xp_earned": xp,
                  "submitted_at": datetime.now(timezone.utc).isoformat()}}
    )
    await add_xp(user["user_id"], xp)
    await record_daily_activity(user["user_id"])
    if score >= 80:
        await award_badge(user["user_id"], "olympiad_winner")

    return {"score": score, "correct": correct, "total": len(questions), "xp_earned": xp}

@api_router.get("/olympiad/leaderboard/{competition_id}")
async def get_olympiad_leaderboard(competition_id: str, user: dict = Depends(get_current_user)):
    entries = await db.olympiad_entries.find(
        {"competition_id": competition_id, "submitted": True},
        {"_id": 0, "user_id": 1, "score": 1, "correct": 1, "xp_earned": 1}
    ).sort("score", -1).to_list(50)

    for entry in entries:
        u = await db.users.find_one({"user_id": entry["user_id"]}, {"_id": 0, "name": 1, "avatar": 1})
        if u:
            entry["name"] = u.get("name", "Student")
            entry["avatar"] = u.get("avatar", "")
    return {"leaderboard": entries}

# ─── TEACHER DASHBOARD ───

@api_router.get("/teacher/students")
async def get_teacher_students(user: dict = Depends(get_current_user)):
    if user.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")

    students = await db.users.find(
        {"role": "student"},
        {"_id": 0, "user_id": 1, "name": 1, "email": 1, "xp": 1, "level": 1,
         "grade_level": 1, "current_streak": 1, "badges": 1, "created_at": 1}
    ).sort("xp", -1).to_list(200)

    for s in students:
        s["lessons_completed"] = await db.progress.count_documents({"user_id": s["user_id"]})
        s["quizzes_taken"] = await db.quiz_results.count_documents({"user_id": s["user_id"]})
        s["badges_count"] = len(s.get("badges", []))

    total_students = len(students)
    active_today = await db.daily_activity.count_documents({
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
    })
    avg_xp = sum(s.get("xp", 0) for s in students) / max(total_students, 1)

    return {
        "students": students,
        "overview": {
            "total_students": total_students,
            "active_today": active_today,
            "average_xp": round(avg_xp),
            "total_lessons_completed": sum(s.get("lessons_completed", 0) for s in students),
            "total_quizzes_taken": sum(s.get("quizzes_taken", 0) for s in students)
        }
    }

@api_router.get("/teacher/student/{student_id}")
async def get_student_detail(student_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")

    student = await db.users.find_one({"user_id": student_id}, {"_id": 0, "password_hash": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    progress = await db.progress.find({"user_id": student_id}, {"_id": 0}).to_list(1000)
    quiz_results = await db.quiz_results.find({"user_id": student_id}, {"_id": 0}).to_list(1000)
    return {"student": student, "progress": progress, "quiz_results": quiz_results}

# ─── PARENT DASHBOARD ───

@api_router.post("/parent/link-child")
async def link_child(data: LinkChildRequest, user: dict = Depends(get_current_user)):
    if user.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Parent access required")

    child = await db.users.find_one({"email": data.child_email, "role": "student"}, {"_id": 0})
    if not child:
        raise HTTPException(status_code=404, detail="Student not found with that email")

    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$addToSet": {"linked_children": child["user_id"]}}
    )
    return {"message": "Child linked successfully", "child_name": child["name"]}

@api_router.get("/parent/children")
async def get_parent_children(user: dict = Depends(get_current_user)):
    if user.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Parent access required")

    children_ids = user.get("linked_children", [])
    children = []
    for cid in children_ids:
        child = await db.users.find_one({"user_id": cid}, {"_id": 0, "password_hash": 0, "linked_children": 0})
        if child:
            child["lessons_completed"] = await db.progress.count_documents({"user_id": cid})
            child["quizzes_taken"] = await db.quiz_results.count_documents({"user_id": cid})
            recent_quiz = await db.quiz_results.find({"user_id": cid}, {"_id": 0}).sort("completed_at", -1).to_list(5)
            child["recent_quizzes"] = recent_quiz
            streak = await db.daily_activity.find({"user_id": cid}, {"_id": 0, "date": 1}).sort("date", -1).to_list(7)
            child["recent_activity_dates"] = [a["date"] for a in streak]
            children.append(child)

    return {"children": children}

# ─── DASHBOARD ───

@api_router.get("/dashboard")
async def get_dashboard(user: dict = Depends(get_current_user)):
    completed_count = await db.progress.count_documents({"user_id": user["user_id"]})
    quiz_count = await db.quiz_results.count_documents({"user_id": user["user_id"]})
    total_lessons = await db.lessons.count_documents({})
    cert_count = await db.certificates.count_documents({"user_id": user["user_id"]})
    recent = await db.progress.find({"user_id": user["user_id"]}, {"_id": 0}).sort("completed_at", -1).to_list(5)

    current_level = user.get("level", 1)
    current_xp = user.get("xp", 0)
    next_threshold = LEVEL_THRESHOLDS[min(current_level, len(LEVEL_THRESHOLDS)-1)] if current_level < len(LEVEL_THRESHOLDS) else LEVEL_THRESHOLDS[-1]
    prev_threshold = LEVEL_THRESHOLDS[current_level - 1] if current_level > 0 else 0

    return {
        "user": {k: v for k, v in user.items() if k not in ("password_hash", "linked_children", "parent_email")},
        "stats": {
            "total_xp": current_xp,
            "level": current_level,
            "lessons_completed": completed_count,
            "total_lessons": total_lessons,
            "quizzes_taken": quiz_count,
            "certificates_earned": cert_count,
            "current_streak": user.get("current_streak", 0),
            "longest_streak": user.get("longest_streak", 0),
            "xp_to_next_level": next_threshold - current_xp,
            "level_progress": ((current_xp - prev_threshold) / max(next_threshold - prev_threshold, 1)) * 100
        },
        "recent_activity": recent
    }

# ─── SEED DATA ───

@api_router.post("/seed")
async def seed_data():
    track_count = await db.tracks.count_documents({})
    if track_count > 0:
        comp_count = await db.competitions.count_documents({})
        if comp_count == 0:
            await seed_competitions()
        return {"message": "Data already seeded"}

    tracks = [
        {"track_id": "track_foundations", "title": "AI Foundations", "description": "Discover what AI is, how it works, and where you see it every day in India!", "icon": "brain", "color": "#4F46E5", "lesson_count": 5, "difficulty": "beginner", "grade_levels": ["middle_school", "high_school"]},
        {"track_id": "track_tools", "title": "AI Tools Training", "description": "Learn to use AI writing tools, image generators, and coding assistants hands-on!", "icon": "tools", "color": "#FF9F1C", "lesson_count": 5, "difficulty": "intermediate", "grade_levels": ["middle_school", "high_school"]},
        {"track_id": "track_ethics", "title": "Responsible & Ethical AI", "description": "Understand AI bias, data privacy, deepfakes, and how to be a responsible AI user.", "icon": "shield-check", "color": "#00F5D4", "lesson_count": 5, "difficulty": "beginner", "grade_levels": ["middle_school", "high_school"]},
        {"track_id": "track_projects", "title": "AI Projects", "description": "Build real AI projects: study planners, chatbots, art portfolios, and community solutions!", "icon": "rocket-launch", "color": "#A855F7", "lesson_count": 4, "difficulty": "advanced", "grade_levels": ["high_school"]},
    ]

    lessons = [
        {"lesson_id": "les_f1", "track_id": "track_foundations", "title": "What is Artificial Intelligence?", "description": "Learn what AI really means and how it differs from regular software.", "content": "## What is AI?\n\nArtificial Intelligence (AI) is when computers are programmed to think and learn like humans. Unlike a calculator that just follows instructions, AI can:\n\n- **Learn** from examples\n- **Recognize patterns**\n- **Make decisions**\n\n### AI in Your Daily Life in India\n\n- **Google Maps** uses AI to predict traffic\n- **Swiggy/Zomato** uses AI to estimate delivery times\n- **Instagram** uses AI to show you posts you might like\n- **Google Assistant** understands your voice using AI\n\n### Key Takeaway\nAI is not magic - it's math and data working together!", "order": 1, "duration_minutes": 7, "xp_reward": 25, "lesson_type": "theory"},
        {"lesson_id": "les_f2", "track_id": "track_foundations", "title": "Types of AI", "description": "Explore Narrow AI, General AI, and Super AI.", "content": "## Types of AI\n\n### 1. Narrow AI (What we have today)\nAI that's really good at ONE specific task:\n- Chess-playing AI\n- Voice assistants\n- Spam filters\n\n### 2. General AI (Still being researched)\nAI that could do ANY intellectual task a human can.\n\n### 3. Super AI (Science fiction... for now!)\nAI smarter than all humans - only exists in movies like Robot (Enthiran)!\n\n### Fun Fact\nIndia's ISRO uses Narrow AI for satellite image analysis!", "order": 2, "duration_minutes": 6, "xp_reward": 25, "lesson_type": "theory"},
        {"lesson_id": "les_f3", "track_id": "track_foundations", "title": "How Machines Learn", "description": "Understand machine learning basics with fun examples!", "content": "## Machine Learning Basics\n\nImagine teaching a toddler to recognize a dog:\n1. You show them many pictures of dogs\n2. They learn the pattern\n3. Now they can identify new dogs!\n\n**Machine Learning works the same way!**\n\n### Three Types of ML\n\n**1. Supervised Learning** - Like studying with a solution manual\n**2. Unsupervised Learning** - Finding patterns alone\n**3. Reinforcement Learning** - Trial and error\n\n### Indian ML Success Story\nThe Aadhaar system uses ML to match fingerprints of 1.4 billion Indians!", "order": 3, "duration_minutes": 8, "xp_reward": 30, "lesson_type": "theory"},
        {"lesson_id": "les_f4", "track_id": "track_foundations", "title": "Data: The Fuel of AI", "description": "Learn why data is so important.", "content": "## Data: AI's Food\n\nJust like you need food to grow, AI needs DATA to learn!\n\n### Good Data vs Bad Data\n\n**Good Data:** Diverse, clean, large enough\n**Bad Data:** Biased, noisy, too small\n\n### India Example\nIf an AI is trained only on English text, it won't understand Hindi, Tamil, or Bengali!\n\n### Think About It\nIf you trained an AI on only cricket data, could it understand kabaddi?", "order": 4, "duration_minutes": 6, "xp_reward": 25, "lesson_type": "theory"},
        {"lesson_id": "les_f5", "track_id": "track_foundations", "title": "AI in India: Real-World Examples", "description": "Discover amazing AI applications in India!", "content": "## AI Making a Difference in India\n\n### Agriculture\n- **Intello Labs**: AI checks crop quality from photos\n- **CropIn**: Predicts harvest yield\n\n### Healthcare\n- **Qure.ai**: AI reads chest X-rays in rural hospitals\n- **Niramai**: AI detects breast cancer early\n\n### Education\n- **BYJU'S**: Personalized learning using AI\n\n### Your Turn!\nCan you think of a problem in your community that AI could solve?", "order": 5, "duration_minutes": 7, "xp_reward": 30, "lesson_type": "interactive"},
        {"lesson_id": "les_t1", "track_id": "track_tools", "title": "AI Writing Assistants", "description": "Master AI tools for writing!", "content": "## AI Writing Tools\n\n### The SECRET Formula: RICE\n- **R**ole: Tell AI who to be\n- **I**nstruction: What to do\n- **C**ontext: Background info\n- **E**xample: Show desired format\n\n### Important Rule\nNEVER submit AI writing as your own! Always add your own ideas.", "order": 1, "duration_minutes": 8, "xp_reward": 30, "lesson_type": "interactive"},
        {"lesson_id": "les_t2", "track_id": "track_tools", "title": "AI Image Generators", "description": "Create amazing art using AI!", "content": "## AI Art Creation\n\n### Writing Great Image Prompts\n**Structure:** [Subject] + [Style] + [Details] + [Mood]\n\n**Examples:**\n- A colorful Indian marketplace at sunset, digital painting\n- A robot teaching math to children, cartoon style\n\n### Ethics Note\nDon't claim AI art as hand-drawn. Respect copyright.", "order": 2, "duration_minutes": 7, "xp_reward": 30, "lesson_type": "interactive"},
        {"lesson_id": "les_t3", "track_id": "track_tools", "title": "AI Coding Assistants", "description": "Learn how AI can help you write code!", "content": "## Coding with AI Help\n\n### Golden Rules\n1. **Understand before using** - Don't copy code you don't understand\n2. **Test everything** - AI code can have bugs\n3. **Learn the basics first** - AI is a helper, not a replacement\n4. **Academic honesty** - Follow your school's rules", "order": 3, "duration_minutes": 8, "xp_reward": 30, "lesson_type": "interactive"},
        {"lesson_id": "les_t4", "track_id": "track_tools", "title": "AI Presentation Builders", "description": "Create stunning presentations with AI!", "content": "## AI-Powered Presentations\n\n### Presentation Tips\n- Max 6 words per bullet point\n- One idea per slide\n- Use images, not walls of text\n- Practice speaking, not reading", "order": 4, "duration_minutes": 6, "xp_reward": 25, "lesson_type": "interactive"},
        {"lesson_id": "les_t5", "track_id": "track_tools", "title": "AI Productivity Tools", "description": "Boost your study routine with AI!", "content": "## Study Smarter with AI\n\n### AI-Powered Study Techniques\n1. Smart Summarization\n2. Flashcard Generation\n3. Practice Questions\n4. Concept Mapping\n\n### Remember\nAI tools should SUPPLEMENT your study, not REPLACE it.", "order": 5, "duration_minutes": 7, "xp_reward": 25, "lesson_type": "interactive"},
        {"lesson_id": "les_e1", "track_id": "track_ethics", "title": "Understanding AI Bias", "description": "Learn how AI can be unfair.", "content": "## AI Bias: When AI Gets It Wrong\n\n### Real Examples\n- Hiring AI rejected women's resumes\n- Face recognition struggles with darker skin tones\n- Language AI has gender bias\n\n### How to Fight Bias\n1. Diverse data\n2. Testing with different groups\n3. Transparency\n4. Human oversight", "order": 1, "duration_minutes": 8, "xp_reward": 30, "lesson_type": "theory"},
        {"lesson_id": "les_e2", "track_id": "track_ethics", "title": "Data Privacy & You", "description": "Protect your personal information.", "content": "## Your Data, Your Rights\n\n### India's Data Protection\n- **DPDPA 2023** - Your rights: Access, correction, erasure\n- Parental consent needed for under-18\n\n### Privacy Checklist\n1. Review app permissions\n2. Use strong passwords\n3. Enable 2FA\n4. Think before sharing", "order": 2, "duration_minutes": 7, "xp_reward": 25, "lesson_type": "theory"},
        {"lesson_id": "les_e3", "track_id": "track_ethics", "title": "Deepfakes & Misinformation", "description": "Learn to spot AI-generated fake content.", "content": "## Deepfakes: Seeing Isn't Believing\n\n### The SIFT Method\n- **S**top: Don't react immediately\n- **I**nvestigate the source\n- **F**ind better coverage\n- **T**race claims to original source", "order": 3, "duration_minutes": 8, "xp_reward": 30, "lesson_type": "interactive"},
        {"lesson_id": "les_e4", "track_id": "track_ethics", "title": "Cyber Safety Essentials", "description": "Stay safe online.", "content": "## Staying Safe in the AI Age\n\n### Emergency Actions\n1. Tell a trusted adult\n2. Screenshot evidence\n3. Report to cybercrime.gov.in\n4. Don't engage with suspicious contacts", "order": 4, "duration_minutes": 7, "xp_reward": 25, "lesson_type": "theory"},
        {"lesson_id": "les_e5", "track_id": "track_ethics", "title": "Being an AI Ethics Champion", "description": "Make a pledge to use AI responsibly!", "content": "## The AI Ethics Champion Pledge\n\n*I pledge to:*\n- Use AI tools honestly and responsibly\n- Protect my privacy and others'\n- Stand against AI bias\n- Help create technology for everyone\n- Be a responsible digital citizen of India\n\nCongratulations! You're now an AI Ethics Champion!", "order": 5, "duration_minutes": 6, "xp_reward": 35, "lesson_type": "interactive"},
        {"lesson_id": "les_p1", "track_id": "track_projects", "title": "Build an AI Study Planner", "description": "Design an AI-powered study schedule.", "content": "## Project: AI Study Planner\n\n### Design Thinking Process\n1. **Empathize** - Interview classmates\n2. **Define** - Problem statement\n3. **Ideate** - Brainstorm features\n4. **Prototype** - Create wireframes\n5. **Test** - Get feedback", "order": 1, "duration_minutes": 15, "xp_reward": 50, "lesson_type": "project"},
        {"lesson_id": "les_p2", "track_id": "track_projects", "title": "Design an AI Chatbot", "description": "Create a school chatbot concept.", "content": "## Project: School AI Chatbot\n\n### Steps\n1. Choose purpose (Homework Helper, Career Guide, etc.)\n2. Design personality and name\n3. Plan conversations\n4. Add safety features\n5. Build a demo presentation", "order": 2, "duration_minutes": 15, "xp_reward": 50, "lesson_type": "project"},
        {"lesson_id": "les_p3", "track_id": "track_projects", "title": "Create an AI Art Portfolio", "description": "Build a themed AI art collection!", "content": "## Project: AI Art Portfolio\n\n### Choose a Theme\n- Incredible India\n- Future Cities\n- Science Wonders\n- Mythology Meets Tech\n\nUse the AI Art Studio to generate your artwork!", "order": 3, "duration_minutes": 20, "xp_reward": 50, "lesson_type": "project"},
        {"lesson_id": "les_p4", "track_id": "track_projects", "title": "AI for Your Community", "description": "Solve a local problem with AI!", "content": "## Project: AI Community Solution\n\n### Process\n- Week 1: Research your neighborhood\n- Week 2: Design AI solution\n- Week 3: Create prototype presentation\n- Week 4: Present and share\n\nThis is Design Thinking in action!", "order": 4, "duration_minutes": 20, "xp_reward": 60, "lesson_type": "project"},
    ]

    await db.tracks.insert_many(tracks)
    await db.lessons.insert_many(lessons)
    await seed_competitions()

    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.user_sessions.create_index("session_token")
    await db.progress.create_index([("user_id", 1), ("lesson_id", 1)])
    await db.tracks.create_index("track_id")
    await db.lessons.create_index("track_id")
    await db.lessons.create_index("lesson_id")
    await db.daily_activity.create_index([("user_id", 1), ("date", 1)])
    await db.certificates.create_index([("user_id", 1), ("track_id", 1)])
    await db.competitions.create_index("competition_id")
    await db.olympiad_entries.create_index([("user_id", 1), ("competition_id", 1)])

    return {"message": "Seed data created", "tracks": len(tracks), "lessons": len(lessons)}

async def seed_competitions():
    comps = [
        {"competition_id": "comp_ai_basics_2026", "title": "AI Fundamentals Challenge 2026", "description": "Test your knowledge of AI basics, machine learning, and real-world AI applications in India.", "difficulty": "medium", "time_limit": 15, "num_questions": 10, "xp_reward": 150, "start_date": "2026-01-01", "end_date": "2026-12-31", "status": "active", "participants": 0, "icon": "brain"},
        {"competition_id": "comp_ai_ethics_2026", "title": "Responsible AI Olympiad 2026", "description": "Challenge yourself on AI ethics, bias detection, data privacy, and digital safety.", "difficulty": "hard", "time_limit": 20, "num_questions": 10, "xp_reward": 200, "start_date": "2026-01-01", "end_date": "2026-12-31", "status": "active", "participants": 0, "icon": "shield-check"},
        {"competition_id": "comp_future_ai_2026", "title": "Future of AI Innovation Challenge", "description": "Advanced questions on AI trends, prompt engineering, and AI project design.", "difficulty": "hard", "time_limit": 25, "num_questions": 10, "xp_reward": 250, "start_date": "2026-02-01", "end_date": "2026-12-31", "status": "active", "participants": 0, "icon": "rocket-launch"},
    ]
    await db.competitions.insert_many(comps)

# ─── Health Check ───

@api_router.get("/health")
async def health():
    return {"status": "ok", "service": "AI Sparks API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    logger.info("AI Sparks backend starting...")
    track_count = await db.tracks.count_documents({})
    if track_count == 0:
        logger.info("Seeding initial data...")
        await seed_data()
    else:
        comp_count = await db.competitions.count_documents({})
        if comp_count == 0:
            logger.info("Seeding competitions...")
            await seed_competitions()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()