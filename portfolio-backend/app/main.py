from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.achievements import router as achievements_router
from app.routes.auth import router as auth_router
from app.routes.certificates import router as certificates_router
from app.routes.experience import router as experience_router
from app.routes.media import router as media_router
from app.routes.projects import router as projects_router
from app.routes.profile import router as profile_router
from app.routes.skills import router as skills_router
from app.routes.social_links import router as social_links_router

app = FastAPI(title=settings.app_name, version=settings.app_version)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(projects_router, tags=["Projects"])
app.include_router(experience_router, tags=["Experience"])
app.include_router(certificates_router, tags=["Certificates"])
app.include_router(skills_router, tags=["Skills"])
app.include_router(achievements_router, tags=["Achievements"])
app.include_router(social_links_router, tags=["Social Links"])
app.include_router(profile_router, tags=["Profile"])
app.include_router(media_router, tags=["Media"])
