from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc
import pypdf
import io
import json

import models, schemas, database
from services import resume_parser, interview_manager

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="InterviewAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/api/upload-resume", response_model=schemas.Candidate)
async def upload_resume(
    name: str = Form(...),
    role: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        content = await file.read()
        pdf = pypdf.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf.pages:
            text += page.extract_text()
            
        parsed_json_str = resume_parser.parse_resume(text, role)
        
        candidate = models.Candidate(
            name=name,
            role=role,
            extracted_skills=parsed_json_str
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        return candidate
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/start-session", response_model=schemas.Session)
def start_session(session_in: schemas.SessionCreate, db: Session = Depends(get_db)):
    candidate = db.query(models.Candidate).filter(models.Candidate.id == session_in.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    new_session = models.Session(candidate_id=candidate.id)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    # Generate the first question
    result = interview_manager.evaluate_and_generate_next(
        role=candidate.role,
        extracted_skills=candidate.extracted_skills,
        past_qa=[]
    )
    
    first_q = models.QAPair(
        session_id=new_session.id,
        question=result["next_question"]
    )
    db.add(first_q)
    db.commit()
    
    return new_session

@app.post("/api/chat/{session_id}", response_model=schemas.NextQuestionResponse)
def submit_answer(session_id: int, answer_in: schemas.AnswerSubmit, db: Session = Depends(get_db)):
    db_session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    candidate = db_session.candidate
    
    # Find the latest question without an answer
    latest_qa = db.query(models.QAPair).filter(
        models.QAPair.session_id == session_id,
        models.QAPair.answer == None
    ).order_by(desc(models.QAPair.id)).first()
    
    if not latest_qa:
        raise HTTPException(status_code=400, detail="No pending question to answer.")
        
    # Get all past Q&As
    all_qa = db.query(models.QAPair).filter(models.QAPair.session_id == session_id).order_by(models.QAPair.id).all()
    past_qa = [{"question": qa.question, "answer": qa.answer, "evaluation": qa.evaluation} for qa in all_qa if qa.answer is not None]
    past_qa.append({"question": latest_qa.question, "answer": answer_in.answer, "evaluation": None}) # Add the current one conceptually
    
    result = interview_manager.evaluate_and_generate_next(
        role=candidate.role,
        extracted_skills=candidate.extracted_skills,
        past_qa=past_qa, # Evaluate everything including the current answer
        latest_answer=answer_in.answer
    )
    
    # Update latest QA with answer and evaluation
    latest_qa.answer = answer_in.answer
    latest_qa.evaluation = result["evaluation"]
    
    if result["is_finished"]:
        from datetime import datetime, timezone
        db_session.end_time = datetime.now(timezone.utc)
        
        # Generate final report
        final_qa = [{"question": qa.question, "answer": qa.answer, "evaluation": qa.evaluation} for qa in all_qa]
        final_qa[-1]["answer"] = answer_in.answer
        final_qa[-1]["evaluation"] = result["evaluation"]
        
        report = interview_manager.generate_final_report(
            role=candidate.role,
            extracted_skills=candidate.extracted_skills,
            past_qa=final_qa
        )
        db_session.final_report = report
        db.commit()
        
        return schemas.NextQuestionResponse(question=result["next_question"], is_finished=True)
    else:
        # Save next question
        next_q = models.QAPair(
            session_id=session_id,
            question=result["next_question"]
        )
        db.add(next_q)
        db.commit()
        
        return schemas.NextQuestionResponse(question=result["next_question"], is_finished=False)

@app.get("/api/results/{session_id}")
def get_results(session_id: int, db: Session = Depends(get_db)):
    db_session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    qa_pairs = db.query(models.QAPair).filter(models.QAPair.session_id == session_id).all()
    
    return {
        "candidate": db_session.candidate.name,
        "role": db_session.candidate.role,
        "start_time": db_session.start_time,
        "end_time": db_session.end_time,
        "qa_pairs": [{"question": q.question, "answer": q.answer, "evaluation": json.loads(q.evaluation) if q.evaluation else None} for q in qa_pairs],
        "final_report": db_session.final_report
    }

@app.get("/api/session/{session_id}/current-question")
def get_current_question(session_id: int, db: Session = Depends(get_db)):
    latest_qa = db.query(models.QAPair).filter(
        models.QAPair.session_id == session_id,
        models.QAPair.answer == None
    ).order_by(desc(models.QAPair.id)).first()
    
    if not latest_qa:
        return {"question": "Session finished or no active question.", "is_finished": True}
        
    return {"question": latest_qa.question, "is_finished": False}
