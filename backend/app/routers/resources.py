from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Resource
from app.schemas import ResourceRead, ResourceCreate

router = APIRouter(prefix="/api/resources", tags=["Resources"])

@router.get("", response_model=List[ResourceRead])
def list_resources(db: Session = Depends(get_db)):
    return db.query(Resource).all()

@router.post("", response_model=ResourceRead)
def create_resource(payload: ResourceCreate, db: Session = Depends(get_db)):
    existing = db.query(Resource).filter(Resource.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Resource name already exists")

    resource = Resource(
        name=payload.name,
        resource_type=payload.resource_type,
        environment=payload.environment,
        sensitivity=payload.sensitivity
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource
