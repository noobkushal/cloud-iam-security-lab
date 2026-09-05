from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import SimulationRequest, SimulationResponse
from app.services.simulator import evaluate_permission

router = APIRouter(prefix="/api/simulator", tags=["Simulator"])

@router.post("/evaluate", response_model=SimulationResponse)
def evaluate_iam_permission(req: SimulationRequest, db: Session = Depends(get_db)):
    """
    Evaluates permission request for an Identity (User/Group) against Action and Resource.
    Returns ALLOWED or DENIED decision along with detailed policy evaluation breakdown.
    """
    return evaluate_permission(db, req)
