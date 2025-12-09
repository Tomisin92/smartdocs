# backend/models.py
from pydantic import BaseModel
from typing import List, Optional, Dict

class AnalyzeRequest(BaseModel):
    file_path: str

class RiskScores(BaseModel):
    legal: int
    compliance: int
    operational: int

class Clause(BaseModel):
    id: str
    topic: str
    heading: str
    severity: str          # "red" | "amber" | "green"
    is_deviation: bool
    is_missing: bool
    risk_scores: RiskScores
    rationale: str
    suggested_position: str
    snippet: str

class DealMetadata(BaseModel):
    deal_name: str
    borrower: str
    facility_size: str
    margin: str
    tenor: str
    governing_law: str

class Summary(BaseModel):
    overview: str
    time_saved_hours: float

class AnalyzeResponse(BaseModel):
    deal_metadata: DealMetadata
    clauses: List[Clause]
    summary: Summary
