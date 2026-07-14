from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.deps import get_db

router = APIRouter(tags=["health"])


@router.get(
    "/health",
    summary="Service and database health check",
    description="Returns `{ status: ok, database: connected }` when PostgreSQL accepts a ping.",
    tags=["health"],
)
def health_check(db: Session = Depends(get_db)) -> dict:
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}
