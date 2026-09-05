import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
from app.seed_data import seed_database
from app.models import User
from app.routers import (
    dashboard,
    users,
    groups,
    policies,
    resources,
    findings,
    simulator,
    audit_logs
)

# Initialize Database Schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cloud IAM Security Lab API",
    description="Educational IAM auditing, permission simulation, and security monitoring platform backend.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Educational local setup
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(dashboard.router)
app.include_router(users.router)
app.include_router(groups.router)
app.include_router(policies.router)
app.include_router(resources.router)
app.include_router(findings.router)
app.include_router(simulator.router)
app.include_router(audit_logs.router)

@app.on_event("startup")
def startup_event():
    """Auto-seed initial database if empty on startup."""
    db = next(get_db())
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            seed_database(db)
    finally:
        db.close()

@app.post("/api/seed", tags=["Admin"])
def reset_and_seed_data(db: Session = Depends(get_db)):
    """Resets database and populates initial educational demo data."""
    seed_database(db)
    return {"message": "Database successfully seeded with realistic IAM security scenarios."}

@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "Cloud IAM Security Lab Backend"}
