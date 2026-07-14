import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import health, job_problems, job_runs, jobs, problems
from app.core.config import settings
from app.core.middleware import RequestLoggingMiddleware, register_exception_handlers

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

app = FastAPI(
    title="Organization Job Handler API",
    description="REST API for pipeline jobs, problems, and run status.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)

register_exception_handlers(app)

app.include_router(health.router)
app.include_router(health.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(problems.router, prefix="/api/v1")
app.include_router(job_problems.router, prefix="/api/v1")
app.include_router(job_runs.router, prefix="/api/v1")
