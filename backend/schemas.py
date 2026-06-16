from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class CandidateBase(BaseModel):
    name: str = "Anonymous"
    role: str

class CandidateCreate(CandidateBase):
    extracted_skills: str

class Candidate(CandidateBase):
    id: int
    extracted_skills: str

    class Config:
        from_attributes = True

class SessionBase(BaseModel):
    candidate_id: int

class SessionCreate(SessionBase):
    pass

class Session(SessionBase):
    id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    final_report: Optional[str] = None

    class Config:
        from_attributes = True

class QAPairBase(BaseModel):
    session_id: int
    question: str

class QAPairCreate(QAPairBase):
    pass

class QAPair(QAPairBase):
    id: int
    answer: Optional[str] = None
    evaluation: Optional[str] = None

    class Config:
        from_attributes = True

class AnswerSubmit(BaseModel):
    answer: str

class NextQuestionResponse(BaseModel):
    question: str
    is_finished: bool = False
