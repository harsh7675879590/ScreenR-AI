from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, default="Anonymous")
    role = Column(String, index=True)
    extracted_skills = Column(Text) # JSON string

    sessions = relationship("Session", back_populates="candidate")

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    final_report = Column(Text, nullable=True) # JSON string

    candidate = relationship("Candidate", back_populates="sessions")
    qa_pairs = relationship("QAPair", back_populates="session")

class QAPair(Base):
    __tablename__ = "qa_pairs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    question = Column(Text)
    answer = Column(Text, nullable=True)
    evaluation = Column(Text, nullable=True) # JSON string (e.g. score, feedback)

    session = relationship("Session", back_populates="qa_pairs")
